import { AzureTTSClient } from 'js-tts-wrapper';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const subscriptionKey = process.env.AZURE_SUBSCRIPTION_KEY?.replace(/^\uFEFF/, '').trim();
    const region = process.env.AZURE_REGION?.replace(/^\uFEFF/, '').trim();

    if (!subscriptionKey || !region) {
      console.error('AZURE_SUBSCRIPTION_KEY or AZURE_REGION is not set');
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const { text, voiceId, rate, pitch, volume } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!voiceId) {
      return NextResponse.json({ error: 'Voice ID is required' }, { status: 400 });
    }

    const client = new AzureTTSClient({ subscriptionKey, region });

    const { audioStream } = await client.synthToBytestream(text, {
      voice: voiceId,
      rate,
      pitch,
      volume,
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
  } catch (error) {
    console.error('Error in Azure TTS API:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
