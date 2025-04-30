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
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const result = await generate('board', text, {
      maxTokens: 200,
      temperature: 0.7
    });

    console.log('Generated board:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating board:', error);
    return NextResponse.json(
      { error: 'Failed to generate board' },
      { status: 500 }
    );
  }
} 