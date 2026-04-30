import { GeminiTTSClient } from 'js-tts-wrapper';
import { NextResponse } from 'next/server';
import { DEFAULT_GEMINI_VOICE_ID, GEMINI_FLASH_TTS_MODEL, GEMINI_VOICES } from '@/lib/gemini-voices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/^\uFEFF/, '').trim();

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const { text, voiceId } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const resolvedVoiceId = GEMINI_VOICES.some(voice => voice.voice_id === voiceId)
      ? voiceId
      : DEFAULT_GEMINI_VOICE_ID;

    const client = new GeminiTTSClient({
      apiKey,
      model: GEMINI_FLASH_TTS_MODEL,
      voice: resolvedVoiceId,
    });

    const audioBytes = await client.synthToBytes(text);

    return new Response(Buffer.from(audioBytes), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBytes.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error in Gemini TTS API:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
