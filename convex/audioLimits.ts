// ---------------------------------------------------------------------------
// Audio tile limits and validators.
//
// IMPORTANT: This module deliberately contains only constants and pure
// functions — no Convex imports. That lets the frontend re-export from here
// (see lib/audio/constants.ts) so client-side checks stay in lock-step with
// server-side enforcement.
// ---------------------------------------------------------------------------

export const MAX_AUDIO_LABEL_LENGTH = 80;
export const MAX_AUDIO_DURATION_MS = 60_000;
/** ~5 MB. A 60s opus/aac clip is well under this; WAV will exceed it (intentional). */
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
/** Show a "X seconds left" warning when the remaining time falls under this. */
export const COUNTDOWN_WARNING_MS = 10_000;

/**
 * MIME types we accept on the server. Codec parameters (e.g. `;codecs=opus`)
 * are stripped before comparison.
 */
export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
] as const;

export type AllowedAudioMimeType = typeof ALLOWED_AUDIO_MIME_TYPES[number];

export function normaliseAudioMimeType(mime: string): string {
  return (mime.split(';')[0] ?? '').trim().toLowerCase();
}

export function isAllowedAudioMimeType(mime: string): boolean {
  const base = normaliseAudioMimeType(mime);
  return (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(base);
}

export function validateAudioLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) throw new Error('Audio tile label is required');
  if (trimmed.length > MAX_AUDIO_LABEL_LENGTH) {
    throw new Error(`Audio tile label must be ${MAX_AUDIO_LABEL_LENGTH} characters or fewer`);
  }
  return trimmed;
}

export function validateAudioMetadata(args: {
  audioMimeType: string;
  audioDurationMs: number;
  audioByteSize: number;
}) {
  if (!args.audioMimeType || !isAllowedAudioMimeType(args.audioMimeType)) {
    throw new Error(
      `Audio MIME type must be one of: ${ALLOWED_AUDIO_MIME_TYPES.join(', ')}`
    );
  }
  if (args.audioDurationMs <= 0 || args.audioDurationMs > MAX_AUDIO_DURATION_MS) {
    throw new Error(`Audio recording must be ${MAX_AUDIO_DURATION_MS / 1000} seconds or less`);
  }
  if (args.audioByteSize <= 0) {
    throw new Error('Audio recording is empty');
  }
  if (args.audioByteSize > MAX_AUDIO_BYTES) {
    const mb = (MAX_AUDIO_BYTES / (1024 * 1024)).toFixed(0);
    throw new Error(`Audio recording exceeds ${mb} MB limit`);
  }
}
