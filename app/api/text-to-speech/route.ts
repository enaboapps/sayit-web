import { NextResponse } from 'next/server';
import { ElevenLabsTTSClient } from 'js-tts-wrapper';

// Next.js App Router route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check for API key first
    const apiKey = process.env.ELEVENLABS_API_KEY?.replace(/^\uFEFF/, '').trim();

    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { text, voiceId, stability, similarityBoost, streaming, modelId: requestedModelId } = body;

    const ALLOWED_MODELS = ['eleven_flash_v2_5', 'eleven_v3'];
    const V3_CHAR_LIMIT = 5000;
    const baseModel = ALLOWED_MODELS.includes(requestedModelId) ? requestedModelId : 'eleven_flash_v2_5';
    const modelId = baseModel === 'eleven_v3' && text?.length > V3_CHAR_LIMIT ? 'eleven_flash_v2_5' : baseModel;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 },
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Voice ID is required' },
        { status: 400 },
      );
    }

    const client = new ElevenLabsTTSClient({ apiKey });

    const { audioStream } = await client.synthToBytestream(text, {
      voice: voiceId,
      modelId,
      voiceSettings: {
        stability: stability ?? 0.5,
        similarity_boost: similarityBoost ?? 0.5,
      },
    });

    // Use streaming if requested
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
  } catch (error) {
    console.error('Error in text-to-speech API:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
