/**
 * Re-export of audio limits from the Convex side so that client-side checks
 * (form validation, recorder UI) stay locked to whatever the server enforces.
 *
 * Importing from `@/convex/audioLimits` is safe because that file deliberately
 * has no Convex runtime imports — only constants and pure functions.
 */
export {
  MAX_AUDIO_LABEL_LENGTH,
  MAX_AUDIO_DURATION_MS,
  MAX_AUDIO_BYTES,
  COUNTDOWN_WARNING_MS,
  ALLOWED_AUDIO_MIME_TYPES,
  isAllowedAudioMimeType,
  normaliseAudioMimeType,
} from '@/convex/audioLimits';
