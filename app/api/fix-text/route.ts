import { NextResponse } from 'next/server';
import { fixText } from '@/lib/openrouter';

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
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 },
      );
    }

    const body = await request.json();
    console.log('Received fix text request:', body);
    
    const { text } = body;
    
    if (!text) {
      console.error('No text provided in request');
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 },
      );
    }

    console.log('Attempting to fix text:', text);
    
    try {
      const result = await fixText(text, {
        maxOutputTokens: 200,
        temperature: 0.3, // Lower temperature for more consistent corrections
      });
      
      console.log('Successfully fixed text:', result);
      
      return NextResponse.json(result);
    } catch (genError) {
      console.error('Error fixing text:', genError);
      return NextResponse.json(
        { error: 'Failed to fix text', details: genError instanceof Error ? genError.message : 'Unknown error' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error in fix text API:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}