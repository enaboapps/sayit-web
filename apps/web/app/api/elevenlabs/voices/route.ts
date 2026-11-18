import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/server/api-route';
import { ElevenLabsTTSClient } from 'js-tts-wrapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = serverEnv('ELEVENLABS_API_KEY');

    if (!apiKey) {
      return NextResponse.json({ voices: [], available: false });
    }

    const client = new ElevenLabsTTSClient({ apiKey });
    const voices = await client.getVoices();

    const mapped = voices.map(v => ({
      voice_id: v.id,
      name: v.name,
      gender: v.gender,
      languageCodes: v.languageCodes ?? [],
    }));

    return NextResponse.json({ voices: mapped, available: mapped.length > 0 });
  } catch (error) {
    console.error('Error loading ElevenLabs voices:', error);
    return NextResponse.json({ voices: [], available: false });
  }
}
