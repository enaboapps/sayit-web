import { NextResponse } from 'next/server';
import { generateBoard } from '@/lib/deepinfra';

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

    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 },
      );
    }

    console.log('Attempting to generate board for text:', text);
    
    try {
      const board = await generateBoard(text);
      console.log('Successfully generated board:', board);
      return NextResponse.json({ board });
    } catch (genError) {
      console.error('Error generating board:', genError);
      return NextResponse.json(
        { error: 'Failed to generate board', details: genError instanceof Error ? genError.message : 'Unknown error' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error in board API:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
} 