import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { getUserIdentity } from './users';
import { nextFixedGridCell } from './aacLayout';
import { loadHydratedBoardTiles } from './boardTileHydration';


// Query: Get all phrase boards for current user (owned + assigned to them)
export const getPhraseBoards = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const phraseCache = new Map<string, Doc<'phrases'> | null>();
    const profileCache = new Map<string, Doc<'profiles'> | null>();
    const boardCache = new Map<string, Doc<'phraseBoards'> | null>();

    const getCachedPhrase = async (phraseId: Id<'phrases'>) => {
      const cacheKey = phraseId.toString();
      if (phraseCache.has(cacheKey)) {
        return phraseCache.get(cacheKey) ?? null;
      }

      const phrase = await ctx.db.get(phraseId);
      phraseCache.set(cacheKey, phrase ?? null);
      return phrase ?? null;
    };

    const getCachedProfile = async (userId: string) => {
      if (profileCache.has(userId)) {
        return profileCache.get(userId) ?? null;
      }

      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .first();
      profileCache.set(userId, profile ?? null);
      return profile ?? null;
    };

    const getCachedBoard = async (boardId: Id<'phraseBoards'>) => {
      const cacheKey = boardId.toString();
      if (boardCache.has(cacheKey)) {
        return boardCache.get(cacheKey) ?? null;
      }
      const board = await ctx.db.get(boardId);
      boardCache.set(cacheKey, board ?? null);
      return board ?? null;
    };

    // Get boards owned by the user (caregiver's boards). Exclude
    // pendingDelete rows so the picker stops rendering them the instant the
    // user clicks Delete on an imported package — the cascade sweep then
    // chunks through the actual delete in the background.
    const ownedBoards = (await ctx.db
      .query('phraseBoards')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect()).filter((board) => !board.pendingDelete);

    // Get boards assigned to this user as a client (same exclusion).
    const assignedBoards = (await ctx.db
      .query('phraseBoards')
      .withIndex('by_client', (q) => q.eq('forClientId', identity.subject))
      .collect()).filter((board) => !board.pendingDelete);

    // Process owned boards - resolve client names if forClientId is set
    const ownedBoardsWithInfo = await Promise.all(
      ownedBoards.map(async (board) => {
        const { tiles, phraseLinks } = await loadHydratedBoardTiles(
          ctx,
          board._id,
          identity.subject,
          { getPhrase: getCachedPhrase, getBoard: getCachedBoard }
        );

        // Get client name if this board is for a client
        let forClientName = null;
        if (board.forClientId) {
          const clientProfile = await getCachedProfile(board.forClientId);
          forClientName = clientProfile?.fullName || clientProfile?.email || 'Client';
        }

        return {
          ...board,
          phrase_board_phrases: phraseLinks,
          tiles,
          isShared: false,
          isOwner: true,
          accessLevel: 'edit' as const,
          sharedBy: null,
          forClientName,
        };
      })
    );

    // Process assigned boards (boards where this user is the client)
    const assignedBoardsWithInfo = await Promise.all(
      assignedBoards.map(async (board) => {
        const { tiles, phraseLinks } = await loadHydratedBoardTiles(
          ctx,
          board._id,
          identity.subject,
          { getPhrase: getCachedPhrase, getBoard: getCachedBoard }
        );

        // Get caregiver name
        const caregiverProfile = await getCachedProfile(board.userId);

        return {
          ...board,
          phrase_board_phrases: phraseLinks,
          tiles,
          isShared: true,
          isOwner: false,
          accessLevel: board.clientAccessLevel || 'view',
          sharedBy: caregiverProfile?.fullName || caregiverProfile?.email || 'Caregiver',
          forClientName: null,
        };
      })
    );

    // Combine and return all boards
    return [...ownedBoardsWithInfo, ...assignedBoardsWithInfo];
  },
});

// Query: Get a single phrase board by ID (owned or assigned)
export const getPhraseBoard = query({
  args: { id: v.id('phraseBoards') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return null;
    }

    const phraseCache = new Map<string, Doc<'phrases'> | null>();
    const profileCache = new Map<string, Doc<'profiles'> | null>();
    const boardCache = new Map<string, Doc<'phraseBoards'> | null>();

    const getCachedPhrase = async (phraseId: Id<'phrases'>) => {
      const cacheKey = phraseId.toString();
      if (phraseCache.has(cacheKey)) {
        return phraseCache.get(cacheKey) ?? null;
      }

      const phrase = await ctx.db.get(phraseId);
      phraseCache.set(cacheKey, phrase ?? null);
      return phrase ?? null;
    };

    const getCachedProfile = async (userId: string) => {
      if (profileCache.has(userId)) {
        return profileCache.get(userId) ?? null;
      }

      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .first();
      profileCache.set(userId, profile ?? null);
      return profile ?? null;
    };

    const getCachedBoard = async (boardId: Id<'phraseBoards'>) => {
      const cacheKey = boardId.toString();
      if (boardCache.has(cacheKey)) {
        return boardCache.get(cacheKey) ?? null;
      }
      const board = await ctx.db.get(boardId);
      boardCache.set(cacheKey, board ?? null);
      return board ?? null;
    };

    const board = await ctx.db.get(args.id);
    if (!board) {
      return null;
    }

    // Check if user owns the board or is the assigned client
    const isOwner = board.userId === identity.subject;
    const isAssignedClient = board.forClientId === identity.subject;

    if (!isOwner && !isAssignedClient) {
      return null; // User has no access
    }

    const { tiles, phraseLinks } = await loadHydratedBoardTiles(
      ctx,
      args.id,
      identity.subject,
      { getPhrase: getCachedPhrase, getBoard: getCachedBoard }
    );

    // Get caregiver name for assigned clients
    let sharedBy = null;
    if (isAssignedClient && !isOwner) {
      const caregiverProfile = await getCachedProfile(board.userId);
      sharedBy = caregiverProfile?.fullName || caregiverProfile?.email || 'Caregiver';
    }

    // Get client name for owner
    let forClientName = null;
    if (isOwner && board.forClientId) {
      const clientProfile = await getCachedProfile(board.forClientId);
      forClientName = clientProfile?.fullName || clientProfile?.email || 'Client';
    }

    return {
      ...board,
      phrase_board_phrases: phraseLinks,
      tiles,
      isShared: isAssignedClient && !isOwner,
      isOwner,
      accessLevel: isOwner ? 'edit' : (board.clientAccessLevel || 'view'),
      sharedBy,
      forClientName,
    };
  },
});

// Mutation: Add a new phrase board
export const addPhraseBoard = mutation({
  args: {
    name: v.string(),
    position: v.number(),
    forClientId: v.optional(v.string()),
    clientAccessLevel: v.optional(v.union(v.literal('view'), v.literal('edit'))),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const boardId = await ctx.db.insert('phraseBoards', {
      userId: identity.subject,
      name: args.name,
      position: args.position,
      forClientId: args.forClientId,
      clientAccessLevel: args.forClientId ? (args.clientAccessLevel || 'view') : undefined,
      layoutMode: 'free',
    });

    return boardId;
  },
});

// Note: `createAACStarterBoard` was removed when the named-preset feature was
// retired. OBF/OBZ import (see `convex/openBoardImport.ts`) is now the
// canonical way to seed a board with AAC vocabulary.

// Mutation: Update a phrase board
export const updatePhraseBoard = mutation({
  args: {
    id: v.id('phraseBoards'),
    name: v.optional(v.string()),
    position: v.optional(v.number()),
    // User-toggleable: drill-down boards imported from OBF vocabularies are
    // hidden by default but the user can promote any board to the picker
    // (or hide a manually-created one) from the edit-board page.
    hiddenFromPicker: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const { id, ...updates } = args;

    // Verify ownership
    const board = await ctx.db.get(id);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(id, updates);
  },
});

// Mutation: Delete a phrase board
export const deletePhraseBoard = mutation({
  args: {
    id: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Verify ownership
    const board = await ctx.db.get(args.id);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Delete all tile placements on this board (and the phrase rows that
    // were exclusive to it). Navigate tiles on OTHER boards that point at
    // this board are intentionally left in place — they will render as a
    // broken-target tile until the owner edits or removes them.
    const tilesOnBoard = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.id))
      .collect();

    for (const tile of tilesOnBoard) {
      if (tile.kind === 'audio' && tile.audioStorageId) {
        await ctx.storage.delete(tile.audioStorageId);
      }
      await ctx.db.delete(tile._id);
      if (tile.kind === 'phrase' && tile.phraseId) {
        await ctx.db.delete(tile.phraseId);
      }
    }

    // Also clean up any legacy phraseBoardPhrases rows still hanging around
    // pre-migration. Safe even when the table is empty.
    const legacyLinks = await ctx.db
      .query('phraseBoardPhrases')
      .withIndex('by_board', (q) => q.eq('boardId', args.id))
      .collect();
    for (const link of legacyLinks) {
      await ctx.db.delete(link._id);
    }

    // Delete the board
    await ctx.db.delete(args.id);
  },
});

// Mutation: Add a phrase to a board
export const addPhraseToBoard = mutation({
  args: {
    phraseId: v.id('phrases'),
    boardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Verify phrase ownership
    const phrase = await ctx.db.get(args.phraseId);
    if (!phrase || phrase.userId !== identity.subject) {
      throw new Error('Unauthorized - phrase');
    }

    // Verify board access (owner or assigned client with edit access)
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const isOwner = board.userId === identity.subject;
    const isAssignedClientWithEdit =
      board.forClientId === identity.subject && board.clientAccessLevel === 'edit';

    if (!isOwner && !isAssignedClientWithEdit) {
      throw new Error('Unauthorized - board');
    }

    // Load tiles for cell-collision detection and position derivation.
    // We deliberately allow duplicate phrase text within a board: the polymorphic
    // tile model uses tile-level identity, and OBF imports may legitimately
    // produce duplicates (e.g. ergonomic placement of "yes" in two cells).
    // Cell-collision is the binding constraint, not text uniqueness.
    const existingTiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    const position = existingTiles.length;
    await ctx.db.insert('boardTiles', {
      boardId: args.boardId,
      position,
      kind: 'phrase',
      phraseId: args.phraseId,
      tileRole: board.layoutMode === 'fixedGrid' ? 'fringe' : undefined,
      ...(nextFixedGridCell(board, existingTiles) ?? {}),
    });
  },
});

// Mutation: Reorder phrases on a board
export const reorderPhrasesOnBoard = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    orderedPhraseIds: v.array(v.id('phrases')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Verify board access
    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error('Board not found');

    const isOwner = board.userId === identity.subject;
    const isAssignedClientWithEdit =
      board.forClientId === identity.subject && board.clientAccessLevel === 'edit';

    if (!isOwner && !isAssignedClientWithEdit) {
      throw new Error('Unauthorized');
    }

    // Reorder by phrase id: only phrase-kind tiles are affected. Navigate-kind
    // tiles keep their existing position (callers using mixed-kind grids should
    // use boardTiles.reorderTiles which is tile-id based).
    const tiles = await ctx.db
      .query('boardTiles')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect();

    const tileByPhraseId = new Map<string, typeof tiles[number]>();
    for (const tile of tiles) {
      if (tile.kind === 'phrase' && tile.phraseId) {
        tileByPhraseId.set(tile.phraseId.toString(), tile);
      }
    }

    await Promise.all(
      args.orderedPhraseIds.map((phraseId, index) => {
        const tile = tileByPhraseId.get(phraseId.toString());
        if (tile) return ctx.db.patch(tile._id, { position: index });
      })
    );
  },
});

// Mutation: Remove a phrase from a board
export const removePhraseFromBoard = mutation({
  args: {
    phraseId: v.id('phrases'),
    boardId: v.id('phraseBoards'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Verify edit access on the target board. (Pre-existing bug: this
    // mutation only authenticated, not authorized — any logged-in user
    // could remove tiles from any board.)
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error('Board not found');
    }
    const isOwner = board.userId === identity.subject;
    const isAssignedClientWithEdit =
      board.forClientId === identity.subject && board.clientAccessLevel === 'edit';
    if (!isOwner && !isAssignedClientWithEdit) {
      throw new Error('Unauthorized');
    }

    const tile = await ctx.db
      .query('boardTiles')
      .withIndex('by_phrase', (q) => q.eq('phraseId', args.phraseId))
      .filter((q) => q.eq(q.field('boardId'), args.boardId))
      .first();

    if (tile) {
      // Locked AAC core tiles are protected at every entry point — without
      // this check a client could bypass the lock by calling
      // removePhraseFromBoard directly (the deletePhrase guard fires too late
      // because by then the tile is already gone). Sibling mutation
      // boardTiles.removePhraseTileFromBoard enforces the same invariant.
      if (tile.isLocked && tile.tileRole === 'core') {
        throw new Error('Locked core tiles cannot be removed from the board with this action');
      }
      await ctx.db.delete(tile._id);
    }
  },
});

// Query: Get boards for a specific client (used by caregivers on dashboard)
export const getBoardsForClient = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    // Get boards owned by current user that are for this client
    const boards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_client', (q) => q.eq('forClientId', args.clientId))
      .collect();

    // Filter to only boards owned by the current user
    const ownedBoards = boards.filter((board) => board.userId === identity.subject);

    return ownedBoards;
  },
});

// Mutation: Update board client access level
export const updateBoardClientAccess = mutation({
  args: {
    boardId: v.id('phraseBoards'),
    accessLevel: v.union(v.literal('view'), v.literal('edit')),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const board = await ctx.db.get(args.boardId);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.boardId, {
      clientAccessLevel: args.accessLevel,
    });
  },
});

// Mutation: Unassign board from client (set forClientId to undefined)
export const unassignBoardFromClient = mutation({
  args: { boardId: v.id('phraseBoards') },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const board = await ctx.db.get(args.boardId);
    if (!board || board.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.boardId, {
      forClientId: undefined,
      clientAccessLevel: undefined,
    });
  },
});

// Query: list AAC import packages for the current user. Powers the Settings
// page "Imported AAC vocabularies" section so users can see what they've
// imported and trigger a bulk Delete. pendingDelete packages are still
// surfaced (their cascade sweep is in flight) but the UI grays them out.
export const listImportedPackages = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return [];

    const packages = await ctx.db
      .query('importedPackages')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect();

    return packages
      .map((pkg) => ({
        id: pkg._id,
        name: pkg.name,
        importedAt: pkg.importedAt,
        boardCount: pkg.boardCount,
        pendingDelete: Boolean(pkg.pendingDelete),
      }))
      .sort((left, right) => right.importedAt - left.importedAt);
  },
});
