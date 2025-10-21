'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { TypingSession } from '@/lib/services/DatabaseService';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import { ExclamationTriangleIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function TypingShareViewPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const [session, setSession] = useState<TypingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typing-share-font-size');
      return saved ? parseInt(saved, 10) : 18;
    }
    return 18;
  });

  useEffect(() => {
    localStorage.setItem('typing-share-font-size', fontSize.toString());
  }, [fontSize]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 4, 64));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 4, 12));
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchAndSubscribe() {
      try {
        // Fetch initial session data
        const response = await fetch(`/api/typing-sessions/${key}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('This typing session does not exist or has expired.');
          } else {
            setError('Failed to load typing session.');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSession(data);
        setLoading(false);

        // Subscribe to real-time updates
        channel = supabase
          .channel(`typing-session-${key}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'typing_sessions',
              filter: `session_key=eq.${key}`,
            },
            (payload) => {
              console.log('Real-time update received:', payload);
              setSession(payload.new as TypingSession);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'typing_sessions',
              filter: `session_key=eq.${key}`,
            },
            () => {
              console.log('Session deleted');
              setError('This typing session has ended.');
              setSession(null);
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Error fetching typing session:', err);
        setError('Failed to load typing session.');
        setLoading(false);
      }
    }

    fetchAndSubscribe();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [key]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AnimatedLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Session Unavailable</h1>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-surface rounded-lg shadow-lg border border-border">
          <div className="border-b border-border p-4 sm:p-6">
            <h1 className="text-2xl font-bold text-foreground">Live Typing Share</h1>
            <p className="text-text-secondary text-sm mt-1">
              You are viewing a live typing session. Updates appear in real-time.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="bg-background border border-border rounded-lg p-6 min-h-[20rem]">
              {session?.content !== undefined && session?.content !== null ? (
                <p
                  className="text-foreground whitespace-pre-wrap break-words"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                >
                  {session.content || (
                    <span className="text-text-tertiary italic">Text cleared</span>
                  )}
                </p>
              ) : (
                <p className="text-text-tertiary italic" style={{ fontSize: `${fontSize}px` }}>
                  No content yet. Waiting for the sender to start typing...
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-text-secondary">Connected</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary mr-2">Font Size</span>
                <button
                  onClick={decreaseFontSize}
                  className="w-8 h-8 flex items-center justify-center bg-surface hover:bg-surface-hover text-text-secondary border border-border rounded transition-colors"
                  aria-label="Decrease font size"
                  disabled={fontSize <= 12}
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="text-sm text-text-secondary min-w-[3rem] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={increaseFontSize}
                  className="w-8 h-8 flex items-center justify-center bg-surface hover:bg-surface-hover text-text-secondary border border-border rounded transition-colors"
                  aria-label="Increase font size"
                  disabled={fontSize >= 64}
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
