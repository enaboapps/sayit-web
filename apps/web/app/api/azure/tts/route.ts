import { AzureTTSClient } from 'js-tts-wrapper';
import { apiRoute, ApiError, requireServerEnv } from '@/lib/server/api-route';
import { isLiveTypingSpeechRequest } from '@/lib/server/live-typing-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = apiRoute<{ text?: string; voiceId?: string }>({
  name: 'Azure TTS API',
  access: 'pro',
  allow: ({ body }) => isLiveTypingSpeechRequest(body, 'azure'),
}, async ({ body }) => {
  const { AZURE_SUBSCRIPTION_KEY: subscriptionKey, AZURE_REGION: region } = requireServerEnv('AZURE_SUBSCRIPTION_KEY', 'AZURE_REGION');
  const { text, voiceId } = body;

  if (!text) throw new ApiError(400, 'Text is required');
  if (!voiceId) throw new ApiError(400, 'Voice ID is required');

  const client = new AzureTTSClient({ subscriptionKey, region });

  const { audioStream } = await client.synthToBytestream(text, {
    voice: voiceId,
    format: 'mp3',
    useWordBoundary: false,
  });

  return new Response(audioStream, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
});
