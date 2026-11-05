import { assignBoardToClient, getPhraseBoard } from '@/convex/phraseBoards';
import type { Id } from '@/convex/_generated/dataModel';

const boardId = 'board-1' as Id<'phraseBoards'>;
const db = { get: jest.fn(), query: jest.fn(), patch: jest.fn() };
const ctx = { db, auth: { getUserIdentity: jest.fn() } };
const board = { _id: boardId, userId: 'caregiver-1', name: 'Daily phrases', position: 0 };

function share(accessLevel: 'view' | 'edit' = 'view') {
  return assignBoardToClient._handler(ctx as never, { boardId, clientId: 'client-1', accessLevel });
}

describe('assignBoardToClient', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    ctx.auth.getUserIdentity.mockResolvedValue({ subject: 'caregiver-1' });
    db.get.mockResolvedValue(board);
    db.query.mockReturnValue({
      withIndex: jest.fn().mockReturnValue({
        collect: jest.fn().mockResolvedValue([{ caregiverId: 'caregiver-1', communicatorId: 'client-1' }]),
      }),
    });
  });

  it.each(['view', 'edit'] as const)('assigns the existing board with %s access and leaves its contents intact', async (accessLevel) => {
    await share(accessLevel);
    expect(db.patch).toHaveBeenCalledTimes(1);
    expect(db.patch).toHaveBeenCalledWith(boardId, { forClientId: 'client-1', clientAccessLevel: accessLevel });
  });

  it('makes the board and its existing phrase tiles readable by the client', async () => {
    const storedBoard = { ...board };
    db.get.mockResolvedValue(storedBoard);
    db.patch.mockImplementation(async (_id, updates) => Object.assign(storedBoard, updates));
    await share();
    ctx.auth.getUserIdentity.mockResolvedValue({ subject: 'client-1' });
    const phrase = { _id: 'phrase-1', userId: 'caregiver-1', text: 'Hello' };
    db.get.mockImplementation(async (id) => id === boardId ? storedBoard : phrase);
    db.query.mockImplementation((table) => ({
      withIndex: () => ({
        collect: async () => table === 'boardTiles' ? [{ _id: 'tile-1', boardId, position: 0, kind: 'phrase', phraseId: 'phrase-1' }] : [],
        first: async () => null,
      }),
    }));
    const result = await getPhraseBoard._handler(ctx as never, { id: boardId });
    expect(result).toMatchObject({ isShared: true, isOwner: false, accessLevel: 'view', tiles: [{ kind: 'phrase', phrase }] });
  });

  it('rejects unauthenticated callers', async () => {
    ctx.auth.getUserIdentity.mockResolvedValue(null);
    await expect(share()).rejects.toThrow('Unauthenticated');
    expect(db.patch).not.toHaveBeenCalled();
  });

  it.each([
    [null, 'Unauthorized'],
    [{ ...board, userId: 'someone-else' }, 'Unauthorized'],
    [{ ...board, pendingDelete: true }, 'being deleted'],
    [{ ...board, forClientId: 'other-client' }, 'already assigned'],
    [{ ...board, forClientId: 'client-1' }, 'already assigned'],
  ])('rejects an unavailable board: %j', async (unavailable, message) => {
    db.get.mockResolvedValue(unavailable);
    await expect(share()).rejects.toThrow(message as string);
    expect(db.patch).not.toHaveBeenCalled();
  });

  it('rejects clients without a current relationship even if another client is connected', async () => {
    db.query.mockReturnValue({ withIndex: () => ({ collect: async () => [{ communicatorId: 'other-client' }] }) });
    await expect(share()).rejects.toThrow('Client relationship not found');
    expect(db.patch).not.toHaveBeenCalled();
  });
});
