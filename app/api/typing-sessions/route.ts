import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate a short, URL-safe session key
    const sessionKey = nanoid(10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from('typing_sessions')
      .insert([{
        user_id: userId,
        session_key: sessionKey,
        content: '',
        expires_at: expiresAt.toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      session_key: data.session_key,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error('Error creating typing session:', error);

    return NextResponse.json(
      { error: 'Failed to create typing session' },
      { status: 500 }
    );
  }
}
