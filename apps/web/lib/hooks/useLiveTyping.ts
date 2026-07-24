import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  cleanLiveTypingSpeechSettings,
  type LiveTypingSpeechAction,
  type LiveTypingSpeechCommand,
  type LiveTypingSpeechSettings,
} from '@/lib/live-typing-speech';

export const STORAGE_KEY = 'typing-share-session-key';
const SESSION_KEY_LENGTH = 32;

type TypingSession = {
  _id: Id<'typingSessions'>;
  userId: string;
  sessionKey: string;
  content: string;
  isPaused?: boolean;
  speechCommand?: LiveTypingSpeechCommand;
  expiresAt: number;
  _creationTime: number;
} | null;

export function useLiveTyping() {
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [session, setSession] = useState<TypingSession>(null);

  const createTypingSession = useMutation(api.typingSessions.createTypingSession);
  const updateTypingSessionContent = useMutation(api.typingSessions.updateTypingSessionContent);
  const setTypingSessionPaused = useMutation(api.typingSessions.setTypingSessionPaused);
  const publishTypingSessionSpeechCommand = useMutation(api.typingSessions.publishTypingSessionSpeechCommand);
  const deleteTypingSession = useMutation(api.typingSessions.deleteTypingSession);

  const sessionFromConvex = useQuery(
    api.typingSessions.getTypingSession,
    sessionKey ? { sessionKey } : 'skip'
  );

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window === 'undefined') return;
      const savedKey = window.localStorage.getItem(STORAGE_KEY);
      if (!savedKey) return;

      setSessionKey(savedKey);
    };

    restoreSession();
  }, []);

  // Synchronize convex session data to local state for backwards compatibility
  useEffect(() => {
    if (sessionFromConvex === undefined) {
      return;
    }

    if (sessionFromConvex === null && sessionKey) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setSessionKey(null);
      setSession(null);
      setError('This live typing session has expired.');
      return;
    }

    if (sessionFromConvex) {
      setSession({
        _id: sessionFromConvex._id,
        userId: sessionFromConvex.userId,
        sessionKey: sessionFromConvex.sessionKey,
        content: sessionFromConvex.content,
        isPaused: sessionFromConvex.isPaused,
        speechCommand: sessionFromConvex.speechCommand,
        expiresAt: sessionFromConvex.expiresAt,
        _creationTime: sessionFromConvex._creationTime,
      });
      setError(null);
    }
  }, [sessionFromConvex, sessionKey]);

  const createSession = useCallback(async (): Promise<boolean> => {
    setIsCreating(true);
    setError(null);

    try {
      const newKey = nanoid(SESSION_KEY_LENGTH);
      const created = await createTypingSession({ sessionKey: newKey });

      if (!created) {
        throw new Error('Failed to create live typing session');
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, newKey);
      }

      setSessionKey(newKey);
      setSession({
        _id: created._id,
        userId: created.userId,
        sessionKey: created.sessionKey,
        content: created.content,
        isPaused: created.isPaused,
        speechCommand: created.speechCommand,
        expiresAt: created.expiresAt,
        _creationTime: created._creationTime,
      });
      return true;
    } catch (err) {
      console.error('Error creating live typing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [createTypingSession]);

  const updateContent = useCallback(async (content: string) => {
    if (!sessionKey || session?.isPaused) return;

    // Debounce updates to avoid hammering the server
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        await updateTypingSessionContent({ sessionKey, content });
      } catch (err) {
        console.error('Error updating live typing session:', err);
      }
    }, 300); // 300ms debounce
  }, [session?.isPaused, sessionKey, updateTypingSessionContent]);

  const pauseSession = useCallback(async (): Promise<boolean> => {
    if (!sessionKey || session?.isPaused) return Boolean(sessionKey);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    setIsTransitioning(true);
    setError(null);
    try {
      await setTypingSessionPaused({ sessionKey, isPaused: true });
      setSession((current) => current ? { ...current, isPaused: true } : current);
      return true;
    } catch (err) {
      console.error('Error pausing live typing session:', err);
      setError('Could not pause Live Typing. Check your connection and try again.');
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [session?.isPaused, sessionKey, setTypingSessionPaused]);

  const resumeSession = useCallback(async (content: string): Promise<boolean> => {
    if (!sessionKey || !session?.isPaused) return Boolean(sessionKey);

    setIsTransitioning(true);
    setError(null);
    try {
      await setTypingSessionPaused({ sessionKey, isPaused: false, content });
      setSession((current) => current ? { ...current, content, isPaused: false } : current);
      return true;
    } catch (err) {
      console.error('Error resuming live typing session:', err);
      setError('Could not resume Live Typing. Check your connection and try again.');
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [session?.isPaused, sessionKey, setTypingSessionPaused]);

  const endSession = useCallback(async () => {
    if (!sessionKey) return;

    try {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      await deleteTypingSession({ sessionKey });
      setSessionKey(null);
      setSession(null);

      // Remove from localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Error ending live typing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  }, [sessionKey, deleteTypingSession]);

  const publishSpeechCommand = useCallback(async (
    action: LiveTypingSpeechAction,
    text?: string,
    settings?: LiveTypingSpeechSettings
  ) => {
    if (!sessionKey || session?.isPaused) return;

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
  }, [publishTypingSessionSpeechCommand, session?.isPaused, sessionKey]);

  const getShareableLink = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const key = session?.sessionKey ?? sessionKey;
    if (!key) return null;
    return `${window.location.origin}/typing-share/view/${key}`;
  }, [session, sessionKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    session,
    isSharing: Boolean(sessionKey),
    isCreating,
    isPaused: Boolean(session?.isPaused),
    isTransitioning,
    error,
    createSession,
    updateContent,
    publishSpeechCommand,
    pauseSession,
    resumeSession,
    endSession,
    getShareableLink,
  };
}
