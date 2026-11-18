import { NextResponse } from 'next/server';
import { generateReplySuggestions } from '@/lib/openrouter';
import { MIN_HISTORY_ENTRIES } from '@/lib/reply-suggestions-constants';
import { apiRoute, ApiError, requireServerEnv } from '@/lib/server/api-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = apiRoute<{ history?: unknown }>({ name: 'reply suggestions API', access: 'pro' }, async ({ body }) => {
  requireServerEnv('OPENROUTER_API_KEY');

  const history = Array.isArray(body.history)
    ? body.history.filter((value: unknown): value is string => typeof value === 'string')
      .map((value: string) => value.trim())
      .filter(Boolean)
    : [];

  if (history.length < MIN_HISTORY_ENTRIES) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
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
    throw new ApiError(500, 'Failed to generate suggestions');
  }
});
