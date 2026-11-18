import { NextResponse } from 'next/server';
import { fixText } from '@/lib/openrouter';
import { apiRoute, ApiError, requireServerEnv } from '@/lib/server/api-route';

// Next.js App Router route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = apiRoute<{ text?: string }>({ name: 'fix text API', access: 'pro' }, async ({ body }) => {
  requireServerEnv('OPENROUTER_API_KEY');
  const { text } = body;

  if (!text) throw new ApiError(400, 'Text is required');

  try {
    const result = await fixText(text, {
      maxOutputTokens: 200,
      temperature: 0.3, // Lower temperature for more consistent corrections
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fixing text:', error);
    throw new ApiError(500, 'Failed to fix text');
  }
});
