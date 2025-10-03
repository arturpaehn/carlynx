import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Lazy initialization to avoid build errors when env vars not set
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-09-30.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 create-checkout-session called');
    console.log('📝 Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
    });
    
    // Initialize Stripe inside try-catch to handle missing env var gracefully
    const stripe = getStripe();
    console.log('✅ Stripe initialized');
    
    const body = await request.json();
    const { amount, listingTitle, userId, userEmail, listingId } = body;

    console.log('📦 Received checkout request:', { amount, listingTitle, userId, userEmail, listingId });

    // Validate input
    if (!amount || !listingTitle || !userId || !listingId) {
      console.error('Missing required fields:', { amount: !!amount, listingTitle: !!listingTitle, userId: !!userId, listingId: !!listingId });
      return NextResponse.json(
        { error: 'Missing required fields', received: { amount: !!amount, listingTitle: !!listingTitle, userId: !!userId, listingId: !!listingId } },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    console.log('💳 Creating Stripe session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CarLynx Vehicle Listing',
              description: `30-day listing: ${listingTitle}`,
              images: ['https://carlynx.us/logo.png'], // Your logo URL
            },
            unit_amount: amount, // Amount in cents (500 = $5.00)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/add-listing?cancelled=true`,
      metadata: {
        userId: userId,
        listingTitle: listingTitle,
        listingId: listingId, // Store listing_id to activate after payment
      },
      customer_email: userEmail,
    });

    console.log('✅ Stripe session created:', session.id);
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url // Return URL for redirect
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
