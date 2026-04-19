import { NextResponse } from 'next/server';
import { GEMINI_VOICES } from '@/lib/gemini-voices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/^\uFEFF/, '').trim();

  if (!apiKey) {
    return NextResponse.json({ voices: [], available: false });
  }

  return NextResponse.json({ voices: GEMINI_VOICES, available: true });
}
