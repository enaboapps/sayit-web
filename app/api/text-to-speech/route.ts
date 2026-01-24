import { NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Next.js App Router route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check for API key first
    if (!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
      console.error('NEXT_PUBLIC_ELEVENLABS_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { text, voiceId, stability, similarityBoost, streaming } = body;

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

    const client = new ElevenLabsClient({
      apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
    });

    // Use streaming if requested
    if (streaming) {
      const audioStream = await client.textToSpeech.stream(voiceId, {
        text: text,
        modelId: 'eleven_flash_v2_5',
        voiceSettings: {
          stability: stability ?? 0.5,
          similarityBoost: similarityBoost ?? 0.5,
        },
      });

      // Return streaming response
      return new Response(audioStream as unknown as ReadableStream, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Non-streaming fallback (original behavior)
    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: text,
      modelId: 'eleven_flash_v2_5',
      voiceSettings: {
        stability: stability ?? 0.5,
        similarityBoost: similarityBoost ?? 0.5,
      },
    });

    // Convert ReadableStream to Buffer
    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);

    // Return the audio data with appropriate headers
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
