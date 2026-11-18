import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { TTSProviderType } from '@/lib/tts-types';
import { serverEnv } from './api-route';
import { userHasPro } from './pro-access';

// How long after the sharer presses speak a viewer may still fetch that audio.
export const LIVE_TYPING_SPEECH_WINDOW_MS = 2 * 60_000;

export interface LiveTypingSpeechRequest {
  sessionKey: string;
  commandId: string;
}

function readLiveTyping(body: unknown): LiveTypingSpeechRequest | null {
  const liveTyping = (body as { liveTyping?: unknown } | null)?.liveTyping as Partial<LiveTypingSpeechRequest> | undefined;
  if (typeof liveTyping?.sessionKey !== 'string' || typeof liveTyping.commandId !== 'string') return null;
  return { sessionKey: liveTyping.sessionKey, commandId: liveTyping.commandId };
}

// Live Typing viewers are usually signed out, but they play the sharer's cloud
// voice. Their TTS request is allowed only for the session's current speak
// command: same command, same text, same provider, sent recently, the session
// is sharing and not paused, and the sharer has SayIt Pro.
//
// Only the latest command counts. If the sharer speaks again before a
// viewer's request arrives, the earlier one is refused and skipped.
export async function isLiveTypingSpeechRequest(body: unknown, provider: TTSProviderType): Promise<boolean> {
  const liveTyping = readLiveTyping(body);
  const text = (body as { text?: unknown } | null)?.text;
  const convexUrl = serverEnv('NEXT_PUBLIC_CONVEX_URL');
  const serverSecret = serverEnv('CONVEX_WEBHOOK_SECRET');
  if (!liveTyping || typeof text !== 'string' || !convexUrl || !serverSecret) return false;

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const session = await convex.query(api.typingSessions.getTypingSessionForServer, {
      serverSecret,
      sessionKey: liveTyping.sessionKey,
    });
    const command = session?.speechCommand;
    if (!session || session.isActive === false || session.isPaused || !command) return false;

    const matches = command.id === liveTyping.commandId
      && command.action === 'speak'
      && command.text === text
      && command.settings?.provider === provider
      && Date.now() - command.createdAt <= LIVE_TYPING_SPEECH_WINDOW_MS;

    return matches && await userHasPro(session.userId);
  } catch (error) {
    console.error('Error checking Live Typing speech access:', error);
    return false;
  }
}
