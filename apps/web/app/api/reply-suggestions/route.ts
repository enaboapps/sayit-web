import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateReplySuggestions } from '@/lib/openrouter';
import { MIN_HISTORY_ENTRIES } from '@/lib/reply-suggestions-constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const history = Array.isArray(body?.history)
      ? body.history.filter((value: unknown): value is string => typeof value === 'string')
        .map((value: string) => value.trim())
        .filter(Boolean)
      : [];

    if (history.length < MIN_HISTORY_ENTRIES) {
      return NextResponse.json({ suggestions: [] });
    }

    const { suggestions } = await generateReplySuggestions(history, {
      maxOutputTokens: 160,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
    });

    const normalizedSuggestions = Array.from(
      new Set(
        suggestions
          .map((suggestion) => suggestion.trim())
          .filter(Boolean)
      )
    ).slice(0, 3);

    return NextResponse.json({ suggestions: normalizedSuggestions });
  } catch (error) {
    console.error('Error generating reply suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 },
    );
  }
}
