import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/server/api-route';
import { AzureTTSClient } from 'js-tts-wrapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subscriptionKey = serverEnv('AZURE_SUBSCRIPTION_KEY');
    const region = serverEnv('AZURE_REGION');

    if (!subscriptionKey || !region) {
      return NextResponse.json({ voices: [], available: false });
    }

    const client = new AzureTTSClient({ subscriptionKey, region });
    const unifiedVoices = await client.getVoices();

    const voices = unifiedVoices.map(v => ({
      voice_id: v.id,
      name: v.name,
      gender: v.gender,
      languageCodes: v.languageCodes ?? [],
    }));

    return NextResponse.json({ voices, available: voices.length > 0 });
  } catch (error) {
    console.error('Error loading Azure voices:', error);
    return NextResponse.json({ voices: [], available: false });
  }
}
