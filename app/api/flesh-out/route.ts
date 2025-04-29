import { NextResponse } from 'next/server';
import { generate } from '@/lib/deepinfra';

export const config = {
  runtime: 'nodejs',
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export async function POST(request: Request) {
  try {
    // Check for API key first
    if (!process.env.DEEPINFRA_API_KEY) {
      console.error('DEEPINFRA_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 },
      );
    }

    const { text, mode } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 },
      );
    }

    console.log('Attempting to flesh out text:', text, 'with mode:', mode);
    
    try {
      const fleshedOutText = await generate(mode || 'fleshOut', text, {
        maxTokens: 200,
        temperature: 0.7,
      });
      console.log('Successfully generated text:', fleshedOutText);
      return NextResponse.json({ text: fleshedOutText });
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