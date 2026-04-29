import type { QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';

// ---------------------------------------------------------------------------
// Shared board access helper
//
// Used by mutations/queries that need to gate on whether the caller can read
// or edit a given phraseBoard. Centralised here so that audio uploads and
// tile mutations apply identical rules.
// ---------------------------------------------------------------------------

export type BoardAccess = {
  board: Doc<'phraseBoards'>;
  isOwner: boolean;
  canEdit: boolean;
  canRead: boolean;
};

export async function getBoardAccess(
  ctx: QueryCtx,
  boardId: Id<'phraseBoards'>,
  userId: string
): Promise<BoardAccess | null> {
  const board = await ctx.db.get(boardId);
  if (!board) return null;

  const isOwner = board.userId === userId;
  const isAssignedClient = board.forClientId === userId;
  const canEdit =
    isOwner || (isAssignedClient && board.clientAccessLevel === 'edit');
  const canRead = isOwner || isAssignedClient;

  return { board, isOwner, canEdit, canRead };
}
