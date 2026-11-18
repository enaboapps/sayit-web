import { act, renderHook, waitFor } from '@testing-library/react';
import { useLiveTyping, LEGACY_STORAGE_KEY } from '@/lib/hooks/useLiveTyping';

const mockMutations: Record<string, jest.Mock> = {
  start: jest.fn(),
  update: jest.fn(),
  setPaused: jest.fn(),
  publish: jest.fn(),
  stop: jest.fn(),
  reset: jest.fn(),
  delete: jest.fn(),
};
let mockAccountSession: unknown;
let mockIsAuthenticated = true;

jest.mock('@/convex/_generated/api', () => ({
  api: {
    typingSessions: {
      startTypingSession: 'start',
      updateTypingSessionContent: 'update',
      setTypingSessionPaused: 'setPaused',
      publishTypingSessionSpeechCommand: 'publish',
      stopTypingSession: 'stop',
      resetTypingSessionLink: 'reset',
      deleteTypingSession: 'delete',
      getMyTypingSession: 'getMine',
    },
  },
}));

jest.mock('convex/react', () => ({
  useConvexAuth: jest.fn(() => ({ isAuthenticated: mockIsAuthenticated, isLoading: false })),
  useMutation: jest.fn((name: string) => mockMutations[name]),
  useQuery: jest.fn(() => mockAccountSession),
}));

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'generated-key'),
}));

const accountSession = {
  _id: 'session-id',
  _creationTime: 1,
  userId: 'user-1',
  sessionKey: 'account-key',
  content: 'Last shared text',
  isPaused: false,
  isActive: true,
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  Object.values(mockMutations).forEach((mock) => mock.mockResolvedValue(true));
  mockAccountSession = accountSession;
  mockIsAuthenticated = true;
  window.localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useLiveTyping account link', () => {
  it('is not sharing and has no link before the account has one', () => {
    mockAccountSession = null;
    const { result } = renderHook(() => useLiveTyping());

    expect(result.current.isSharing).toBe(false);
    expect(result.current.getShareableLink()).toBeNull();
  });

  it('shares the account link on any device', () => {
    const { result } = renderHook(() => useLiveTyping());

    expect(result.current.isSharing).toBe(true);
    expect(result.current.getShareableLink()).toBe(`${window.location.origin}/typing-share/view/account-key`);
  });

  it('keeps the same link while sharing is stopped', () => {
    mockAccountSession = { ...accountSession, isActive: false, content: '' };
    const { result } = renderHook(() => useLiveTyping());

    expect(result.current.isSharing).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.getShareableLink()).toBe(`${window.location.origin}/typing-share/view/account-key`);
  });

  it('starts sharing on the account link', async () => {
    mockAccountSession = null;
    const { result } = renderHook(() => useLiveTyping());

    await act(async () => {
      await expect(result.current.createSession('Current draft')).resolves.toBe(true);
    });

    expect(mockMutations.start).toHaveBeenCalledWith({ sessionKey: 'generated-key', content: 'Current draft' });
  });

  it('stops sharing without deleting the link', async () => {
    const { result } = renderHook(() => useLiveTyping());

    await act(async () => {
      await result.current.endSession();
    });

    expect(mockMutations.stop).toHaveBeenCalledWith({ sessionKey: 'account-key' });
    expect(mockMutations.delete).not.toHaveBeenCalled();
  });

  it('resets the link with a new key', async () => {
    const { result } = renderHook(() => useLiveTyping());

    await act(async () => {
      await expect(result.current.resetLink()).resolves.toBe(true);
    });

    expect(mockMutations.reset).toHaveBeenCalledWith({ sessionKey: 'generated-key' });
  });

  it('reports a failed reset', async () => {
    mockMutations.reset.mockRejectedValue(new Error('Connection lost'));
    const { result } = renderHook(() => useLiveTyping());

    await act(async () => {
      await expect(result.current.resetLink()).resolves.toBe(false);
    });

    expect(result.current.error).toBe('Could not reset the link. Check your connection and try again.');
  });

  it('ends a device-stored session left by an older version', async () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, 'old-device-key');
    renderHook(() => useLiveTyping());

    await waitFor(() => {
      expect(mockMutations.delete).toHaveBeenCalledWith({ sessionKey: 'old-device-key' });
    });
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('waits for Convex auth before cleaning up a device-stored session', () => {
    mockIsAuthenticated = false;
    mockAccountSession = null;
    window.localStorage.setItem(LEGACY_STORAGE_KEY, 'old-device-key');
    renderHook(() => useLiveTyping());

    expect(mockMutations.delete).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBe('old-device-key');
  });

  it('keeps the device-stored key when cleanup fails so it is retried', async () => {
    mockMutations.delete.mockRejectedValue(new Error('Connection lost'));
    window.localStorage.setItem(LEGACY_STORAGE_KEY, 'old-device-key');
    renderHook(() => useLiveTyping());

    await waitFor(() => expect(mockMutations.delete).toHaveBeenCalled());
    await act(async () => {});
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBe('old-device-key');
  });

  it('forgets the device-stored key when the session is already gone', async () => {
    mockMutations.delete.mockRejectedValue(new Error('[CONVEX] Server Error Uncaught Error: Unauthorized'));
    window.localStorage.setItem(LEGACY_STORAGE_KEY, 'old-device-key');
    renderHook(() => useLiveTyping());

    await waitFor(() => expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull());
  });

  it('waits for the account query before cleaning up a device-stored session', () => {
    mockAccountSession = undefined;
    window.localStorage.setItem(LEGACY_STORAGE_KEY, 'old-device-key');
    renderHook(() => useLiveTyping());

    expect(mockMutations.delete).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBe('old-device-key');
  });
});

describe('useLiveTyping pause state', () => {
  it('cancels a pending content update before pausing', async () => {
    const { result } = renderHook(() => useLiveTyping());

    act(() => {
      void result.current.updateContent('Queued private draft');
    });

    await act(async () => {
      await result.current.pauseSession();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockMutations.setPaused).toHaveBeenCalledWith({
      sessionKey: 'account-key',
      isPaused: true,
    });
    expect(mockMutations.update).not.toHaveBeenCalled();
  });

  it('sends debounced content while sharing', () => {
    const { result } = renderHook(() => useLiveTyping());

    act(() => {
      void result.current.updateContent('Hello');
      jest.advanceTimersByTime(300);
    });

    expect(mockMutations.update).toHaveBeenCalledWith({ sessionKey: 'account-key', content: 'Hello' });
  });

  it('does not send content while sharing is stopped', () => {
    mockAccountSession = { ...accountSession, isActive: false };
    const { result } = renderHook(() => useLiveTyping());

    act(() => {
      void result.current.updateContent('Private');
      jest.advanceTimersByTime(300);
    });

    expect(mockMutations.update).not.toHaveBeenCalled();
  });

  it('atomically sends the complete current draft when resuming', async () => {
    mockAccountSession = { ...accountSession, isPaused: true };
    const { result } = renderHook(() => useLiveTyping());

    expect(result.current.isPaused).toBe(true);

    await act(async () => {
      await result.current.resumeSession('Complete private draft');
    });

    expect(mockMutations.setPaused).toHaveBeenCalledWith({
      sessionKey: 'account-key',
      isPaused: false,
      content: 'Complete private draft',
    });
  });

  it('resumes without content to keep the last shared text', async () => {
    mockAccountSession = { ...accountSession, isPaused: true };
    const { result } = renderHook(() => useLiveTyping());

    await act(async () => {
      await result.current.resumeSession();
    });

    expect(mockMutations.setPaused).toHaveBeenCalledWith({ sessionKey: 'account-key', isPaused: false });
  });

  it('keeps the confirmed paused state when resume fails', async () => {
    mockAccountSession = { ...accountSession, isPaused: true };
    mockMutations.setPaused.mockRejectedValue(new Error('Connection lost'));
    const { result } = renderHook(() => useLiveTyping());

    await act(async () => {
      await result.current.resumeSession('Private draft');
    });

    expect(result.current.isPaused).toBe(true);
    expect(result.current.error).toBe(
      'Could not resume Live Typing. Check your connection and try again.'
    );
  });
});
