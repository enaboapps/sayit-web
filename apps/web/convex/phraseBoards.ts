import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { getUserIdentity } from './users';
import {
  AAC_LAYOUT_VERSION,
  AAC_SOURCE_TEMPLATE,
  getCoreWordsForPreset,
  getPresetDimensions,
  nextFixedGridCell,
} from './aacLayout';

// ---------------------------------------------------------------------------
// Shared loaders for tile data (read from boardTiles).
//
// The `phrase_board_phrases` field on board query results is preserved for
// backward compatibility — it returns *only phrase-kind tiles* in the legacy
// shape. New consumers should read the polymorphic `tiles` field instead.
// ---------------------------------------------------------------------------

type LegacyPhraseLink = {
  _id: Id<'boardTiles'>;
  phraseId: Id<'phrases'>;
  boardId: Id<'phraseBoards'>;
  position: number;
  phrase: Doc<'phrases'> | null;
};

type PolymorphicBoardTile =
  | {
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'phrase';
      phrase: Doc<'phrases'> | null;
      cellRow?: number;
      cellColumn?: number;
      cellRowSpan?: number;
      cellColumnSpan?: number;
      tileRole?: Doc<'boardTiles'>['tileRole'];
      wordClass?: Doc<'boardTiles'>['wordClass'];
      isLocked?: boolean;
    }
  | {
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'navigate';
      targetBoardId: Id<'phraseBoards'>;
      targetBoardName: string | null;
      cellRow?: number;
      cellColumn?: number;
      cellRowSpan?: number;
      cellColumnSpan?: number;
      tileRole?: Doc<'boardTiles'>['tileRole'];
      wordClass?: Doc<'boardTiles'>['wordClass'];
      isLocked?: boolean;
    }
  | {
      _id: Id<'boardTiles'>;
      boardId: Id<'phraseBoards'>;
      position: number;
      kind: 'audio';
      audioLabel: string;
      /** null when the underlying storage object is missing/unrecoverable. */
      audioStorageId: Id<'_storage'> | null;
      audioUrl: string | null;
      audioMimeType: string;
      audioDurationMs: number;
      audioByteSize: number;
      cellRow?: number;
      cellColumn?: number;
      cellRowSpan?: number;
      cellColumnSpan?: number;
      tileRole?: Doc<'boardTiles'>['tileRole'];
      wordClass?: Doc<'boardTiles'>['wordClass'];
      isLocked?: boolean;
    };

function tileLayoutMetadata(row: Doc<'boardTiles'>) {
  return {
    cellRow: row.cellRow,
    cellColumn: row.cellColumn,
    cellRowSpan: row.cellRowSpan,
    cellColumnSpan: row.cellColumnSpan,
    tileRole: row.tileRole,
    wordClass: row.wordClass,
    isLocked: row.isLocked,
  };
}

function viewerCanReadBoard(
  board: Doc<'phraseBoards'> | null,
  viewerSubject: string
): boolean {
  if (!board) return false;
  return board.userId === viewerSubject || board.forClientId === viewerSubject;
}

async function loadHydratedBoardTiles(
  ctx: QueryCtx,
  boardId: Id<'phraseBoards'>,
  viewerSubject: string,
  getCachedPhrase: (phraseId: Id<'phrases'>) => Promise<Doc<'phrases'> | null>,
  getCachedBoard: (boardId: Id<'phraseBoards'>) => Promise<Doc<'phraseBoards'> | null>
): Promise<{ tiles: PolymorphicBoardTile[]; phraseLinks: LegacyPhraseLink[] }> {
  const rows = await ctx.db
    .query('boardTiles')
    .withIndex('by_board', (q) => q.eq('boardId', boardId))
    .collect();

  const sorted = [...rows].sort((a, b) => a.position - b.position);

  const tiles: PolymorphicBoardTile[] = [];
  const phraseLinks: LegacyPhraseLink[] = [];

  for (const row of sorted) {
    if (row.kind === 'phrase') {
      const phrase = row.phraseId ? await getCachedPhrase(row.phraseId) : null;
      tiles.push({
        _id: row._id,
        boardId: row.boardId,
        position: row.position,
        kind: 'phrase',
        phrase,
        ...tileLayoutMetadata(row),
      });
      if (row.phraseId) {
        phraseLinks.push({
          _id: row._id,
          phraseId: row.phraseId,
          boardId: row.boardId,
          position: row.position,
          phrase,
        });
      }
      continue;
    }

    if (row.kind === 'audio') {
      // Defensive: surface a broken-state tile if the row is missing one or
      // more required audio fields. Renderer keys on audioUrl===null.
      if (
        !row.audioLabel ||
        !row.audioStorageId ||
        !row.audioMimeType ||
        typeof row.audioDurationMs !== 'number' ||
        typeof row.audioByteSize !== 'number'
      ) {
        tiles.push({
          _id: row._id,
          boardId: row.boardId,
          position: row.position,
          kind: 'audio',
          audioLabel: row.audioLabel ?? 'Audio tile',
          audioStorageId: null,
          audioUrl: null,
          audioMimeType: row.audioMimeType ?? '',
          audioDurationMs: row.audioDurationMs ?? 0,
          audioByteSize: row.audioByteSize ?? 0,
          ...tileLayoutMetadata(row),
        });
        continue;
      }

      tiles.push({
        _id: row._id,
        boardId: row.boardId,
        position: row.position,
        kind: 'audio',
        audioLabel: row.audioLabel,
        audioStorageId: row.audioStorageId,
        audioUrl: await ctx.storage.getUrl(row.audioStorageId),
        audioMimeType: row.audioMimeType,
        audioDurationMs: row.audioDurationMs,
        audioByteSize: row.audioByteSize,
        ...tileLayoutMetadata(row),
      });
      continue;
    }

    // kind === 'navigate'
    if (!row.targetBoardId) {
      // Defensive: shouldn't happen, but emit a broken-state tile if it does.
      tiles.push({
        _id: row._id,
        boardId: row.boardId,
        position: row.position,
        kind: 'navigate',
        targetBoardId: row.boardId,
        targetBoardName: null,
        ...tileLayoutMetadata(row),
      });
      continue;
    }
    const target = await getCachedBoard(row.targetBoardId);
    // Only expose the target name when the viewer can actually read the
    // target board. Otherwise fall back to the broken-state shape so we
    // don't leak names of boards the viewer has no access to (e.g. a
    // caregiver's private board referenced from a client-shared board).
    const canRead = viewerCanReadBoard(target, viewerSubject);
    tiles.push({
      _id: row._id,
      boardId: row.boardId,
      position: row.position,
      kind: 'navigate',
      targetBoardId: row.targetBoardId,
      targetBoardName: canRead ? (target?.name ?? null) : null,
      ...tileLayoutMetadata(row),
    });
  }

  return { tiles, phraseLinks };
}

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

    // Get boards owned by the user (caregiver's boards)
    const ownedBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .collect();

    // Get boards assigned to this user as a client
    const assignedBoards = await ctx.db
      .query('phraseBoards')
      .withIndex('by_client', (q) => q.eq('forClientId', identity.subject))
      .collect();

    // Process owned boards - resolve client names if forClientId is set
    const ownedBoardsWithInfo = await Promise.all(
      ownedBoards.map(async (board) => {
        const { tiles, phraseLinks } = await loadHydratedBoardTiles(
          ctx, board._id, identity.subject, getCachedPhrase, getCachedBoard
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
          ctx, board._id, identity.subject, getCachedPhrase, getCachedBoard
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
      ctx, args.id, identity.subject, getCachedPhrase, getCachedBoard
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
      sourceTemplate: 'custom',
    });

    return boardId;
  },
});

// Mutation: Create a stable fixed-grid AAC starter board using Project Core's
// Universal Core word list (labels only; no third-party symbols are bundled).
export const createAACStarterBoard = mutation({
  args: {
    name: v.string(),
    preset: v.union(v.literal('largeAccess16'), v.literal('standard36'), v.literal('dense48')),
    position: v.number(),
    forClientId: v.optional(v.string()),
    clientAccessLevel: v.optional(v.union(v.literal('view'), v.literal('edit'))),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new Error('Board name is required');
    }

    const dimensions = getPresetDimensions(args.preset);
    const boardId = await ctx.db.insert('phraseBoards', {
      userId: identity.subject,
      name: trimmedName,
      position: args.position,
      forClientId: args.forClientId,
      clientAccessLevel: args.forClientId ? (args.clientAccessLevel || 'view') : undefined,
      layoutMode: 'fixedGrid',
      layoutPreset: args.preset,
      gridRows: dimensions.rows,
      gridColumns: dimensions.columns,
      layoutVersion: AAC_LAYOUT_VERSION,
      sourceTemplate: AAC_SOURCE_TEMPLATE,
    });

    const words = getCoreWordsForPreset(args.preset);
    for (let index = 0; index < words.length; index++) {
      const word = words[index];
      const row = Math.floor(index / dimensions.columns);
      const column = index % dimensions.columns;
      const phraseId = await ctx.db.insert('phrases', {
        userId: identity.subject,
        text: word.text,
        frequency: 0,
        position: index,
      });

      await ctx.db.insert('boardTiles', {
        boardId,
        position: index,
        kind: 'phrase',
        phraseId,
        cellRow: row,
        cellColumn: column,
        cellRowSpan: 1,
        cellColumnSpan: 1,
        tileRole: 'core',
        wordClass: word.wordClass,
        isLocked: true,
      });
    }

    return boardId;
  },
});

// Mutation: Update a phrase board
export const updatePhraseBoard = mutation({
  args: {
    id: v.id('phraseBoards'),
    name: v.optional(v.string()),
    position: v.optional(v.number()),
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
