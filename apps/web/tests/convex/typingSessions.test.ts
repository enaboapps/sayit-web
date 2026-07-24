import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import {
  publishTypingSessionSpeechCommand,
  setTypingSessionPaused,
  updateTypingSessionContent,
} from '@/convex/typingSessions';

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
  provider: 'browser' as const,
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

function publish(args: {
  sessionKey?: string;
  commandId?: string;
  action?: 'speak' | 'stop';
  text?: string;
  settings?: typeof speechSettings;
}) {
  return publishTypingSessionSpeechCommand._handler(mockCtx as never, {
    sessionKey: 'session-key',
    commandId: 'command-1',
    action: 'speak',
    ...args,
  });
}

describe('typingSessions speech commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('stores a speak command for the session owner', async () => {
    mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-1' });
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      expiresAt: Date.now() + 60_000,
    });

    await publish({
      text: 'Hello',
      settings: speechSettings,
    });

    expect(mockDb.patch).toHaveBeenCalledWith('session-1', {
      speechCommand: expect.objectContaining({
        id: 'command-1',
        action: 'speak',
        text: 'Hello',
        createdAt: expect.any(Number),
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

    await expect(publish({
      text: 'Hello',
      settings: speechSettings,
    })).rejects.toThrow('Unauthorized');
    expect(mockDb.patch).not.toHaveBeenCalled();
  });

  test('rejects speak commands without text or settings', async () => {
    mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-1' });
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      expiresAt: Date.now() + 60_000,
    });

    await expect(publish({
      text: '',
      settings: speechSettings,
    })).rejects.toThrow('Text is required');
    await expect(publish({
      text: 'Hello',
    })).rejects.toThrow('Speech settings are required');
    expect(mockDb.patch).not.toHaveBeenCalled();
  });

  test('suppresses speech commands while the session is paused', async () => {
    mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-1' });
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      isPaused: true,
      expiresAt: Date.now() + 60_000,
    });

    await expect(publish({
      text: 'Private text',
      settings: speechSettings,
    })).resolves.toBe(false);
    expect(mockDb.patch).not.toHaveBeenCalled();
  });
});

describe('typingSessions pause state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: 'user-1' });
  });

  test('pauses a session without changing its content', async () => {
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      content: 'Last shared text',
      isPaused: false,
      expiresAt: Date.now() + 60_000,
    });

    await setTypingSessionPaused._handler(mockCtx as never, {
      sessionKey: 'session-key',
      isPaused: true,
    });

    expect(mockDb.patch).toHaveBeenCalledWith('session-1', { isPaused: true });
  });

  test('atomically publishes the current draft when resuming', async () => {
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      content: 'Last shared text',
      isPaused: true,
      expiresAt: Date.now() + 60_000,
    });

    await setTypingSessionPaused._handler(mockCtx as never, {
      sessionKey: 'session-key',
      isPaused: false,
      content: 'Complete private draft',
    });

    expect(mockDb.patch).toHaveBeenCalledWith('session-1', {
      isPaused: false,
      content: 'Complete private draft',
    });
  });

  test('requires the current draft when resuming', async () => {
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      isPaused: true,
      expiresAt: Date.now() + 60_000,
    });

    await expect(setTypingSessionPaused._handler(mockCtx as never, {
      sessionKey: 'session-key',
      isPaused: false,
    })).rejects.toThrow('Current content is required');
    expect(mockDb.patch).not.toHaveBeenCalled();
  });

  test('suppresses content updates while paused, including queued updates', async () => {
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      isPaused: true,
      expiresAt: Date.now() + 60_000,
    });

    await expect(updateTypingSessionContent._handler(mockCtx as never, {
      sessionKey: 'session-key',
      content: 'Should remain private',
    })).resolves.toBe(false);
    expect(mockDb.patch).not.toHaveBeenCalled();
  });

  test('treats a legacy session without a pause flag as active', async () => {
    mockSessionLookup({
      _id: 'session-1',
      userId: 'user-1',
      expiresAt: Date.now() + 60_000,
    });

    await expect(updateTypingSessionContent._handler(mockCtx as never, {
      sessionKey: 'session-key',
      content: 'Visible update',
    })).resolves.toBe(true);
    expect(mockDb.patch).toHaveBeenCalledWith('session-1', {
      content: 'Visible update',
    });
  });
});
