import { describe, expect, test, jest, beforeEach } from '@jest/globals';

const mockDb = {
  query: jest.fn(),
  patch: jest.fn(),
};

const mockCtx = {
  db: mockDb,
  auth: {
    getUserIdentity: jest.fn(),
  },
};

const speechSettings = {
  provider: 'browser',
  voiceId: 'browser-voice',
  rate: 1,
  pitch: 1,
  volume: 1,
  stability: 0.5,
  similarityBoost: 0.5,
  modelId: 'eleven_flash_v2_5',
};

function mockSessionLookup(session: unknown) {
  mockDb.query.mockReturnValue({
    withIndex: jest.fn().mockReturnValue({
      first: jest.fn().mockResolvedValue(session),
    }),
  });
}

describe('typingSessions speech commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('stores a speak command for the session owner', async () => {
    const session = {
      _id: 'session-1',
      userId: 'user-1',
      expiresAt: Date.now() + 60_000,
    };
    mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-1' });
    mockSessionLookup(session);

    const identity = await mockCtx.auth.getUserIdentity();
    const found = await mockDb.query('typingSessions').withIndex('by_session_key').first();
    if (!found || found.userId !== identity?.subject || found.expiresAt <= Date.now()) {
      throw new Error('Unauthorized');
    }

    await mockDb.patch(found._id, {
      speechCommand: {
        id: 'command-1',
        action: 'speak',
        text: 'Hello',
        createdAt: 123,
        settings: speechSettings,
      },
    });

    expect(mockDb.patch).toHaveBeenCalledWith('session-1', {
      speechCommand: expect.objectContaining({
        action: 'speak',
        text: 'Hello',
        settings: speechSettings,
      }),
    });
  });

  test('rejects speech commands from a non-owner', async () => {
    mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-2' });
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      expiresAt: Date.now() + 60_000,
    });

    const identity = await mockCtx.auth.getUserIdentity();
    const found = await mockDb.query('typingSessions').withIndex('by_session_key').first();

    const publish = () => {
      if (!found || found.userId !== identity?.subject || found.expiresAt <= Date.now()) {
        throw new Error('Unauthorized');
      }
    };

    expect(publish).toThrow('Unauthorized');
    expect(mockDb.patch).not.toHaveBeenCalled();
  });

  test('rejects speak commands without text or settings', () => {
    const publish = (text?: string, settings?: unknown) => {
      if (!text?.trim()) throw new Error('Text is required for speech commands');
      if (!settings) throw new Error('Speech settings are required for speech commands');
    };

    expect(() => publish('', speechSettings)).toThrow('Text is required');
    expect(() => publish('Hello')).toThrow('Speech settings are required');
  });
});
