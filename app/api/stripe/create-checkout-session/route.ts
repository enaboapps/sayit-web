import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(req: Request) {
  try {
    const { priceId, userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Processing checkout for user:', userId, 'with email:', email);

    // Skip profile creation in Supabase due to RLS policy
    // Instead, create the Stripe customer directly
    
    // First check if we already have this customer in Stripe
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    let customerId;
    
    if (existingCustomers.data.length > 0) {
      // Use existing customer
      customerId = existingCustomers.data[0].id;
      console.log('Found existing Stripe customer:', customerId);
    } else {
      // Create a new Stripe customer
      console.log('Creating new Stripe customer for:', email);
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          supabase_id: userId,
        },
      });
      customerId = customer.id;
      console.log('New Stripe customer created:', customerId);
    }

    // Create a checkout session
    console.log('Creating checkout session with customer ID:', customerId);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment/success`,
      cancel_url: `${req.headers.get('origin')}/payment/cancel`,
      metadata: {
        userId,
        email
      },
      // Store customer details for webhook processing later
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    console.log('Checkout session created:', session.id);
    console.log('Checkout session URL:', session.url);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 