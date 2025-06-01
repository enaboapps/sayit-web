import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if we have a product ID
    if (productId.startsWith('prod_')) {
      // Retrieve the product
      const product = await stripe.products.retrieve(productId);
      
      // If we have a default price, use it
      if (product.default_price) {
        // Get the price details
        const priceDetails = await stripe.prices.retrieve(product.default_price as string);
        
        const amount = priceDetails.unit_amount || 0;
        const currency = priceDetails.currency || 'usd';
        
        // Format the price for display
        const formattedPrice = formatPrice(amount, currency);
        
        return NextResponse.json({
          priceId: priceDetails.id,
          amount,
          currency,
          formattedPrice,
        });
      } else {
        // Otherwise get all prices for this product and use the first active one
        const prices = await stripe.prices.list({
          product: productId,
          active: true,
        });
        
        if (prices.data.length === 0) {
          throw new Error('No active price found for this product');
        }
        
        const priceDetails = prices.data[0];
        const amount = priceDetails.unit_amount || 0;
        const currency = priceDetails.currency || 'usd';
        
        // Format the price for display
        const formattedPrice = formatPrice(amount, currency);
        
        return NextResponse.json({
          priceId: priceDetails.id,
          amount,
          currency,
          formattedPrice,
        });
      }
    } else {
      // We have a price ID, retrieve it directly
      const priceDetails = await stripe.prices.retrieve(productId);
      
      const amount = priceDetails.unit_amount || 0;
      const currency = priceDetails.currency || 'usd';
      
      // Format the price for display
      const formattedPrice = formatPrice(amount, currency);
      
      return NextResponse.json({
        priceId: priceDetails.id,
        amount,
        currency,
        formattedPrice,
      });
    }
  } catch (err) {
    console.error('Error fetching price:', err);
    return NextResponse.json(
      { error: 'Error fetching price' },
      { status: 500 }
    );
  }
}

function formatPrice(amount: number, currency: string): string {
  // Convert amount from cents to dollars
  const value = amount / 100;
  
  // Format based on currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
} 