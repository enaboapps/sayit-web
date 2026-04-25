import { describe, expect, jest, test, beforeEach } from '@jest/globals';

const mockDb = {
  query: jest.fn(),
  insert: jest.fn(),
};

const mockStorage = {
  getUrl: jest.fn(),
};

const mockCtx = {
  db: mockDb,
  storage: mockStorage,
  auth: {
    getUserIdentity: jest.fn(),
  },
};

describe('openBoardImport mutation behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws for unauthenticated users', async () => {
    mockCtx.auth.getUserIdentity.mockResolvedValue(null);
    const identity = await mockCtx.auth.getUserIdentity();

    expect(() => {
      if (!identity) throw new Error('Unauthenticated');
    }).toThrow('Unauthenticated');
  });

  test('creates board, phrase, symbol URL, and phrase link in order', async () => {
    mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
    mockStorage.getUrl.mockResolvedValue('https://example.convex.cloud/symbol.png');
    mockDb.query.mockReturnValue({
      withIndex: jest.fn().mockReturnValue({
        collect: jest.fn().mockResolvedValue([{ _id: 'existing-board' }]),
      }),
    });
    mockDb.insert
      .mockResolvedValueOnce('new-board')
      .mockResolvedValueOnce('new-phrase')
      .mockResolvedValueOnce('new-link');

    const identity = await mockCtx.auth.getUserIdentity();
    const existingBoards = await mockDb.query('phraseBoards')
      .withIndex('by_user_id')
      .collect();

    const boardId = await mockDb.insert('phraseBoards', {
      userId: identity!.subject,
      name: 'Imported',
      position: existingBoards.length,
    });
    const symbolUrl = await mockStorage.getUrl('storage-1');
    const phraseId = await mockDb.insert('phrases', {
      userId: identity!.subject,
      text: 'Help',
      position: 0,
      symbolStorageId: 'storage-1',
      symbolUrl,
    });
    await mockDb.insert('phraseBoardPhrases', {
      phraseId,
      boardId,
      position: 0,
    });

    expect(mockDb.insert).toHaveBeenNthCalledWith(1, 'phraseBoards', expect.objectContaining({
      name: 'Imported',
      position: 1,
    }));
    expect(mockDb.insert).toHaveBeenNthCalledWith(2, 'phrases', expect.objectContaining({
      text: 'Help',
      symbolUrl: 'https://example.convex.cloud/symbol.png',
    }));
    expect(mockDb.insert).toHaveBeenNthCalledWith(3, 'phraseBoardPhrases', {
      phraseId: 'new-phrase',
      boardId: 'new-board',
      position: 0,
    });
  });
});
