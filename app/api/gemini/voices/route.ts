import { GeminiTTSClient } from 'js-tts-wrapper';
import { NextResponse } from 'next/server';
import { GEMINI_FLASH_TTS_MODEL } from '@/lib/gemini-voices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/^﻿/, '').trim();

    if (!apiKey) {
      return NextResponse.json({ voices: [], available: false });
    }

    const client = new GeminiTTSClient({
      apiKey,
      model: GEMINI_FLASH_TTS_MODEL,
    });

    const unifiedVoices = await client.getVoices();

    const voices = unifiedVoices.map((voice) => ({
      voice_id: voice.id,
      name: voice.name,
      style: typeof voice.metadata?.style === 'string' ? voice.metadata.style : '',
      gender: voice.gender,
      languageCodes: voice.languageCodes ?? [],
    }));

    return NextResponse.json({ voices, available: voices.length > 0 });
  } catch (error) {
    console.error('Error loading Gemini voices:', error);
    return NextResponse.json({ voices: [], available: false });
  }
}
