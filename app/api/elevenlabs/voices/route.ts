import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  preview_url?: string;
  description?: string;
};

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 },
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to load voices' },
        { status: response.status },
      );
    }

    const data = await response.json();
    const voices: ElevenLabsVoice[] = (data?.voices ?? []).map((voice: ElevenLabsVoice) => ({
      voice_id: voice.voice_id,
      name: voice.name || 'Unnamed Voice',
      preview_url: voice.preview_url,
      description: voice.description || '',
    }));

    return NextResponse.json({ voices });
  } catch (error) {
    console.error('Error loading ElevenLabs voices:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
