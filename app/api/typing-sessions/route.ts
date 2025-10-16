import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Debug: Log all cookies
    const allCookies = cookieStore.getAll();
    console.log('All cookies:', allCookies.map(c => c.name));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value;
            console.log(`Getting cookie ${name}:`, value ? 'found' : 'not found');
            return value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Auth check:', { user: user?.id, authError: authError?.message });

    if (authError || !user) {
      console.log('Authentication failed:', authError);
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
        user_id: user.id,
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
