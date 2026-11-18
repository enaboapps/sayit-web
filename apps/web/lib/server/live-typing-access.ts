import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { TTSProviderType } from '@/lib/tts-types';

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
// command: same command, same text, same provider, sent recently, and the
// session is sharing and not paused.
export async function isLiveTypingSpeechRequest(body: unknown, provider: TTSProviderType): Promise<boolean> {
  const liveTyping = readLiveTyping(body);
  const text = (body as { text?: unknown } | null)?.text;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!liveTyping || typeof text !== 'string' || !convexUrl) return false;

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const session = await convex.query(api.typingSessions.getTypingSession, { sessionKey: liveTyping.sessionKey });
    const command = session?.speechCommand;
    if (!session || session.isActive === false || session.isPaused || !command) return false;

    return command.id === liveTyping.commandId
      && command.action === 'speak'
      && command.text === text
      && command.settings?.provider === provider
      && Date.now() - command.createdAt <= LIVE_TYPING_SPEECH_WINDOW_MS;
  } catch (error) {
    console.error('Error checking Live Typing speech access:', error);
    return false;
  }
}
