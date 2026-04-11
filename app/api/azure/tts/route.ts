import { NextResponse } from 'next/server';
import { AzureTTSClient } from 'js-tts-wrapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AzureRate = 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';
type AzurePitch = 'x-low' | 'low' | 'medium' | 'high' | 'x-high';

function rateToAzure(rate?: number): AzureRate | undefined {
  if (rate === undefined) return undefined;
  if (rate <= 0.6) return 'x-slow';
  if (rate <= 0.85) return 'slow';
  if (rate <= 1.15) return 'medium';
  if (rate <= 1.6) return 'fast';
  return 'x-fast';
}

function pitchToAzure(pitch?: number): AzurePitch | undefined {
  if (pitch === undefined) return undefined;
  if (pitch <= 0.6) return 'x-low';
  if (pitch <= 0.85) return 'low';
  if (pitch <= 1.15) return 'medium';
  if (pitch <= 1.6) return 'high';
  return 'x-high';
}

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
      rate: rateToAzure(rate),
      pitch: pitchToAzure(pitch),
      volume: volume !== undefined ? Math.round(volume * 100) : undefined,
    });

    return new Response(audioStream as unknown as ReadableStream, {
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
