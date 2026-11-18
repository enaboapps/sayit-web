import { NextResponse } from 'next/server';
import { ElevenLabsTTSClient } from 'js-tts-wrapper';
import { apiRoute, ApiError, requireServerEnv } from '@/lib/server/api-route';
import { isLiveTypingSpeechRequest } from '@/lib/server/live-typing-access';

// Next.js App Router route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_MODELS = ['eleven_flash_v2_5', 'eleven_v3'];
const V3_CHAR_LIMIT = 5000;

interface Body {
  text?: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  streaming?: boolean;
  modelId?: string;
}

export const POST = apiRoute<Body>({
  name: 'text-to-speech API',
  access: 'pro',
  allow: ({ body }) => isLiveTypingSpeechRequest(body, 'elevenlabs'),
}, async ({ body }) => {
  const { ELEVENLABS_API_KEY: apiKey } = requireServerEnv('ELEVENLABS_API_KEY');
  const { text, voiceId, stability, similarityBoost, streaming, modelId: requestedModelId } = body;

  if (!text) throw new ApiError(400, 'Text is required');
  if (!voiceId) throw new ApiError(400, 'Voice ID is required');

  const baseModel = requestedModelId && ALLOWED_MODELS.includes(requestedModelId) ? requestedModelId : 'eleven_flash_v2_5';
  const modelId = baseModel === 'eleven_v3' && text.length > V3_CHAR_LIMIT ? 'eleven_flash_v2_5' : baseModel;

  const client = new ElevenLabsTTSClient({ apiKey });

  const { audioStream } = await client.synthToBytestream(text, {
    voice: voiceId,
    modelId,
    voiceSettings: {
      stability: stability ?? 0.5,
      similarity_boost: similarityBoost ?? 0.5,
    },
  });

  if (streaming) {
    return new Response(audioStream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  }

  // Non-streaming: buffer the stream before responding
  const reader = audioStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
    },
  });
});
