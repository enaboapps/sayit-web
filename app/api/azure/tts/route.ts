import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AzureRate = 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';
type AzurePitch = 'x-low' | 'low' | 'medium' | 'high' | 'x-high';

function rateToAzure(rate?: number): AzureRate {
  if (rate === undefined || (rate > 0.85 && rate <= 1.15)) return 'medium';
  if (rate <= 0.6) return 'x-slow';
  if (rate <= 0.85) return 'slow';
  if (rate <= 1.6) return 'fast';
  return 'x-fast';
}

function pitchToAzure(pitch?: number): AzurePitch {
  if (pitch === undefined || (pitch > 0.85 && pitch <= 1.15)) return 'medium';
  if (pitch <= 0.6) return 'x-low';
  if (pitch <= 0.85) return 'low';
  if (pitch <= 1.6) return 'high';
  return 'x-high';
}

function volumeToAzure(volume?: number): string {
  if (volume === undefined) return 'medium';
  // volume is 0-1; Azure accepts 0-100 or keywords
  const pct = Math.round(volume * 100);
  return `${pct}%`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSsml(text: string, voiceId: string, rate: AzureRate, pitch: AzurePitch, volume: string): string {
  // Extract language from voice ID (e.g. en-US-JennyNeural → en-US)
  const lang = voiceId.split('-').slice(0, 2).join('-') || 'en-US';
  return `<speak version='1.0' xml:lang='${lang}' xmlns='http://www.w3.org/2001/10/synthesis'>` +
    `<voice name='${voiceId}'>` +
    `<prosody rate='${rate}' pitch='${pitch}' volume='${volume}'>` +
    `${escapeXml(text)}` +
    `</prosody></voice></speak>`;
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

    const ssml = buildSsml(
      text,
      voiceId,
      rateToAzure(rate),
      pitchToAzure(pitch),
      volumeToAzure(volume),
    );

    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const azureResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'sayit-web',
      },
      body: ssml,
    });

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text().catch(() => azureResponse.statusText);
      console.error(`Azure TTS REST error: ${azureResponse.status} ${errorText}`);
      return NextResponse.json(
        { error: 'Azure TTS error', details: errorText },
        { status: azureResponse.status },
      );
    }

    return new Response(azureResponse.body, {
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
