import { NextResponse } from 'next/server';
import { ElevenLabsTTSClient } from 'js-tts-wrapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY?.replace(/^\uFEFF/, '').trim();

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
