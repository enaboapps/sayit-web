import { GeminiTTSClient } from 'js-tts-wrapper';
import { DEFAULT_GEMINI_VOICE_ID, GEMINI_FLASH_TTS_MODEL, GEMINI_VOICES } from '@/lib/gemini-voices';
import { apiRoute, ApiError, requireServerEnv } from '@/lib/server/api-route';
import { isLiveTypingSpeechRequest } from '@/lib/server/live-typing-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = apiRoute<{ text?: string; voiceId?: string }>({
  name: 'Gemini TTS API',
  access: 'pro',
  allow: ({ body }) => isLiveTypingSpeechRequest(body, 'gemini'),
}, async ({ body }) => {
  const { GEMINI_API_KEY: apiKey } = requireServerEnv('GEMINI_API_KEY');
  const { text, voiceId } = body;

  if (!text) throw new ApiError(400, 'Text is required');

  const resolvedVoiceId = GEMINI_VOICES.some(voice => voice.voice_id === voiceId)
    ? voiceId
    : DEFAULT_GEMINI_VOICE_ID;

  const client = new GeminiTTSClient({
    apiKey,
    model: GEMINI_FLASH_TTS_MODEL,
    voice: resolvedVoiceId,
  });

  const audioBytes = await client.synthToBytes(text);

  return new Response(Buffer.from(audioBytes), {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': audioBytes.length.toString(),
      'Cache-Control': 'no-cache',
    },
  });
});
