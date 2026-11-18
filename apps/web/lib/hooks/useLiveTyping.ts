import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  cleanLiveTypingSpeechSettings,
  type LiveTypingSpeechAction,
  type LiveTypingSpeechCommand,
  type LiveTypingSpeechSettings,
} from '@/lib/live-typing-speech';

// Where older clients kept a per-device session key. Only read to clean up.
export const LEGACY_STORAGE_KEY = 'typing-share-session-key';
const SESSION_KEY_LENGTH = 32;

type TypingSession = {
  _id: Id<'typingSessions'>;
  userId: string;
  sessionKey: string;
  content: string;
  isPaused?: boolean;
  isActive?: boolean;
  speechCommand?: LiveTypingSpeechCommand;
  _creationTime: number;
} | null;

type TimeoutRef = { current: NodeJS.Timeout | null };

function clearPendingUpdate(ref: TimeoutRef) {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

/**
 * The signed-in account's permanent Live Typing link. Every device signed in to
 * the account shares the same link and sharing state.
 */
export function useLiveTyping() {
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isResettingLink, setIsResettingLink] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTypingSession = useMutation(api.typingSessions.startTypingSession);
  const updateTypingSessionContent = useMutation(api.typingSessions.updateTypingSessionContent);
  const setTypingSessionPaused = useMutation(api.typingSessions.setTypingSessionPaused);
  const publishTypingSessionSpeechCommand = useMutation(api.typingSessions.publishTypingSessionSpeechCommand);
  const stopTypingSession = useMutation(api.typingSessions.stopTypingSession);
  const resetTypingSessionLink = useMutation(api.typingSessions.resetTypingSessionLink);
  const deleteTypingSession = useMutation(api.typingSessions.deleteTypingSession);

  const { isAuthenticated } = useConvexAuth();
  const accountSession = useQuery(api.typingSessions.getMyTypingSession);
  const session: TypingSession = accountSession ?? null;
  const isSharing = session?.isActive === true;
  const sessionKey = isSharing ? session.sessionKey : null;
  const isPaused = isSharing && Boolean(session.isPaused);

  // End any per-device session left by an older version of the app. Waits for
  // Convex auth so the delete isn't rejected, and keeps the key until the
  // session is gone (or isn't ours) so a failed attempt is retried next load.
  const legacyCleanupStartedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || accountSession === undefined || typeof window === 'undefined') return;
    if (legacyCleanupStartedRef.current) return;
    const legacyKey = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyKey) return;
    legacyCleanupStartedRef.current = true;

    const forget = () => window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    if (legacyKey === accountSession?.sessionKey) {
      forget();
      return;
    }
    deleteTypingSession({ sessionKey: legacyKey })
      .then(forget)
      .catch((err: unknown) => {
        // Unauthorized means the session no longer exists or isn't this account's.
        if (String(err).includes('Unauthorized')) forget();
      });
  }, [accountSession, deleteTypingSession, isAuthenticated]);

  // Another device can stop sharing; drop any queued update when that happens.
  useEffect(() => {
    if (!isSharing) clearPendingUpdate(updateTimeoutRef);
  }, [isSharing]);

  const createSession = useCallback(async (content?: string): Promise<boolean> => {
    setIsCreating(true);
    setError(null);

    try {
      const started = await startTypingSession({
        sessionKey: nanoid(SESSION_KEY_LENGTH),
        ...(content !== undefined ? { content } : {}),
      });
      if (!started) {
        throw new Error('Failed to start Live Typing');
      }
      return true;
    } catch (err) {
      console.error('Error starting live typing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start Live Typing');
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [startTypingSession]);

  const updateContent = useCallback(async (content: string) => {
    if (!sessionKey || isPaused) return;

    // Debounce updates to avoid hammering the server
    clearPendingUpdate(updateTimeoutRef);

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        await updateTypingSessionContent({ sessionKey, content });
      } catch (err) {
        console.error('Error updating live typing session:', err);
      }
    }, 300); // 300ms debounce
  }, [isPaused, sessionKey, updateTypingSessionContent]);

  const pauseSession = useCallback(async (): Promise<boolean> => {
    if (!sessionKey || isPaused) return Boolean(sessionKey);

    clearPendingUpdate(updateTimeoutRef);

    setIsTransitioning(true);
    setError(null);
    try {
      await setTypingSessionPaused({ sessionKey, isPaused: true });
      return true;
    } catch (err) {
      console.error('Error pausing live typing session:', err);
      setError('Could not pause Live Typing. Check your connection and try again.');
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [isPaused, sessionKey, setTypingSessionPaused]);

  // Pass content to publish this device's draft; omit it to keep the last shared text.
  const resumeSession = useCallback(async (content?: string): Promise<boolean> => {
    if (!sessionKey || !isPaused) return Boolean(sessionKey);

    setIsTransitioning(true);
    setError(null);
    try {
      await setTypingSessionPaused({
        sessionKey,
        isPaused: false,
        ...(content !== undefined ? { content } : {}),
      });
      return true;
    } catch (err) {
      console.error('Error resuming live typing session:', err);
      setError('Could not resume Live Typing. Check your connection and try again.');
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [isPaused, sessionKey, setTypingSessionPaused]);

  const endSession = useCallback(async () => {
    if (!sessionKey) return;

    try {
      clearPendingUpdate(updateTimeoutRef);
      await stopTypingSession({ sessionKey });
    } catch (err) {
      console.error('Error stopping live typing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop Live Typing');
    }
  }, [sessionKey, stopTypingSession]);

  const resetLink = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    clearPendingUpdate(updateTimeoutRef);
    setIsResettingLink(true);
    setError(null);
    try {
      await resetTypingSessionLink({ sessionKey: nanoid(SESSION_KEY_LENGTH) });
      return true;
    } catch (err) {
      console.error('Error resetting live typing link:', err);
      setError('Could not reset the link. Check your connection and try again.');
      return false;
    } finally {
      setIsResettingLink(false);
    }
  }, [resetTypingSessionLink, session]);

  const publishSpeechCommand = useCallback(async (
    action: LiveTypingSpeechAction,
    text?: string,
    settings?: LiveTypingSpeechSettings
  ) => {
    if (!sessionKey || isPaused) return;

    try {
      const cleanedSettings = settings ? cleanLiveTypingSpeechSettings(settings) : undefined;

      await publishTypingSessionSpeechCommand({
        sessionKey,
        commandId: nanoid(),
        action,
        ...(text !== undefined ? { text } : {}),
        ...(cleanedSettings ? { settings: cleanedSettings } : {}),
      });
    } catch (err) {
      console.error('Error publishing live typing speech command:', err);
    }
  }, [isPaused, publishTypingSessionSpeechCommand, sessionKey]);

  const getShareableLink = useCallback(() => {
    if (typeof window === 'undefined' || !session) return null;
    return `${window.location.origin}/typing-share/view/${session.sessionKey}`;
  }, [session]);

  // Cleanup on unmount
  useEffect(() => () => clearPendingUpdate(updateTimeoutRef), []);

  return {
    session,
    isSharing,
    isCreating,
    isPaused,
    isTransitioning,
    isResettingLink,
    error,
    createSession,
    updateContent,
    publishSpeechCommand,
    pauseSession,
    resumeSession,
    endSession,
    resetLink,
    getShareableLink,
  };
}
