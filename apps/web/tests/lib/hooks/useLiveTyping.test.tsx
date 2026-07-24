import { act, renderHook, waitFor } from '@testing-library/react';
import { useLiveTyping, STORAGE_KEY } from '@/lib/hooks/useLiveTyping';

const mockCreateSession = jest.fn();
const mockUpdateContent = jest.fn();
const mockSetPaused = jest.fn();
const mockPublishSpeech = jest.fn();
const mockDeleteSession = jest.fn();
let mockSessionQuery: unknown;
let mutationCall = 0;

jest.mock('convex/react', () => ({
  useMutation: jest.fn(() => {
    const mutations = [
      mockCreateSession,
      mockUpdateContent,
      mockSetPaused,
      mockPublishSpeech,
      mockDeleteSession,
    ];
    const mutation = mutations[mutationCall % mutations.length];
    mutationCall += 1;
    return mutation;
  }),
  useQuery: jest.fn(() => mockSessionQuery),
}));

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'command-id'),
}));

const activeSession = {
  _id: 'session-id',
  _creationTime: 1,
  userId: 'user-1',
  sessionKey: 'session-key',
  content: 'Last shared text',
  isPaused: false,
  expiresAt: Date.now() + 60_000,
};

describe('useLiveTyping pause state', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mutationCall = 0;
    mockSessionQuery = activeSession;
    window.localStorage.clear();
    window.localStorage.setItem(STORAGE_KEY, activeSession.sessionKey);
    mockSetPaused.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cancels a pending content update before pausing', async () => {
    const { result } = renderHook(() => useLiveTyping());

    await waitFor(() => {
      expect(result.current.isSharing).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });

    act(() => {
      void result.current.updateContent('Queued private draft');
    });

    await act(async () => {
      await result.current.pauseSession();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSetPaused).toHaveBeenCalledWith({
      sessionKey: 'session-key',
      isPaused: true,
    });
    expect(mockUpdateContent).not.toHaveBeenCalled();
    expect(result.current.isPaused).toBe(true);
  });

  it('atomically sends the complete current draft when resuming', async () => {
    mockSessionQuery = { ...activeSession, isPaused: true };
    const { result } = renderHook(() => useLiveTyping());

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    await act(async () => {
      await result.current.resumeSession('Complete private draft');
    });

    expect(mockSetPaused).toHaveBeenCalledWith({
      sessionKey: 'session-key',
      isPaused: false,
      content: 'Complete private draft',
    });
    expect(result.current.isPaused).toBe(false);
  });

  it('keeps the confirmed paused state when resume fails', async () => {
    mockSessionQuery = { ...activeSession, isPaused: true };
    mockSetPaused.mockRejectedValue(new Error('Connection lost'));
    const { result } = renderHook(() => useLiveTyping());

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    await act(async () => {
      await result.current.resumeSession('Private draft');
    });

    expect(result.current.isPaused).toBe(true);
    expect(result.current.error).toBe(
      'Could not resume Live Typing. Check your connection and try again.'
    );
  });
});
