import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  // Get the Clerk webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;

    console.log('Creating user profile:', { id, email, first_name, last_name });

    // Create or update user profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .upsert([
        {
          id,
          email,
          full_name: first_name && last_name ? `${first_name} ${last_name}` : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Error creating user profile:', error);
      return new Response('Error creating user profile', { status: 500 });
    }

    console.log('User profile created successfully');
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;

    console.log('Updating user profile:', { id, email, first_name, last_name });

    // Update user profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        email,
        full_name: first_name && last_name ? `${first_name} ${last_name}` : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating user profile:', error);
      return new Response('Error updating user profile', { status: 500 });
    }

    console.log('User profile updated successfully');
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    console.log('Deleting user profile:', id);

    // Optionally delete user profile from Supabase
    // Or just mark as deleted if you want to keep the data
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user profile:', error);
      return new Response('Error deleting user profile', { status: 500 });
    }

    console.log('User profile deleted successfully');
  }

  return new Response('', { status: 200 });
}
