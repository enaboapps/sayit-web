import { useState, useEffect, useCallback, useRef } from 'react';
import { TypingSession } from '../services/DatabaseService';

const STORAGE_KEY = 'typing-share-session-key';

export function useTypingShare() {
  const [session, setSession] = useState<TypingSession | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedKey = localStorage.getItem(STORAGE_KEY);
      if (!savedKey) return;

      try {
        const response = await fetch(`/api/typing-sessions/${savedKey}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data);
          setIsSharing(true);
        } else {
          // Session expired or not found, clean up
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('Error restoring typing session:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    restoreSession();
  }, []);

  const createSession = useCallback(async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/typing-sessions', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();

      // Fetch full session details
      const sessionResponse = await fetch(`/api/typing-sessions/${data.session_key}`);
      if (sessionResponse.ok) {
        const fullSession = await sessionResponse.json();
        setSession(fullSession);
        setIsSharing(true);

        // Persist session key to localStorage
        localStorage.setItem(STORAGE_KEY, data.session_key);
      }
    } catch (err) {
      console.error('Error creating typing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateContent = useCallback(async (content: string) => {
    if (!session) return;

    // Debounce updates to avoid hammering the server
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/typing-sessions/${session.session_key}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
      } catch (err) {
        console.error('Error updating typing session:', err);
      }
    }, 300); // 300ms debounce
  }, [session]);

  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      await fetch(`/api/typing-sessions/${session.session_key}`, {
        method: 'DELETE',
      });
      setSession(null);
      setIsSharing(false);

      // Remove from localStorage
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error ending typing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  }, [session]);

  const getShareableLink = useCallback(() => {
    if (!session) return null;
    return `${window.location.origin}/typing-share/view/${session.session_key}`;
  }, [session]);

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
    isSharing,
    isCreating,
    error,
    createSession,
    updateContent,
    endSession,
    getShareableLink,
  };
}
