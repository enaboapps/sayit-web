import { NextResponse } from 'next/server';
import { generate } from '@/lib/openrouter';

// Next.js App Router route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check for API key first
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { text, mode } = body;
    
    if (!text) {
      console.error('No text provided in request');
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 },
      );
    }

    if (!mode) {
      console.error('No mode provided in request');
      return NextResponse.json(
        { error: 'Mode is required' },
        { status: 400 },
      );
    }

    try {
      const result = await generate(mode, text, {
        maxOutputTokens: 200,
        temperature: 0.7,
      });

      return NextResponse.json(result);
    } catch (genError) {
      console.error('Error generating text:', genError);
      return NextResponse.json(
        { error: 'Failed to generate text', details: genError instanceof Error ? genError.message : 'Unknown error' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error in flesh out API:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
} 
