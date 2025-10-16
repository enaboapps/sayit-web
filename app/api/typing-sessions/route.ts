import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';
import { nanoid } from 'nanoid';

export async function POST() {
  try {
    // Generate a short, URL-safe session key
    const sessionKey = nanoid(10);

    const session = await databaseService.createTypingSession(sessionKey);

    return NextResponse.json({
      session_key: session.session_key,
      expires_at: session.expires_at,
    });
  } catch (error) {
    console.error('Error creating typing session:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create typing session' },
      { status: 500 }
    );
  }
}
