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
    console.log('🚀 reactivate-listing API called');
    console.log('📝 Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
    });
    
    // Initialize Stripe inside try-catch to handle missing env var gracefully
    const stripe = getStripe();
    console.log('✅ Stripe initialized');
    
    const body = await request.json();
    const { listingId, listingTitle, userId, userEmail } = body;

    console.log('📦 Received reactivation request:', { listingId, listingTitle, userId, userEmail });

    // Validate input
    if (!listingId || !listingTitle || !userId) {
      console.error('Missing required fields:', { listingId: !!listingId, listingTitle: !!listingTitle, userId: !!userId });
      return NextResponse.json(
        { error: 'Missing required fields', received: { listingId: !!listingId, listingTitle: !!listingTitle, userId: !!userId } },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session for reactivation
    console.log('💳 Creating Stripe session for reactivation...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CarLynx Listing Reactivation',
              description: `14-day reactivation: ${listingTitle}`,
              images: ['https://carlynx.us/logo.png'], // Your logo URL
            },
            unit_amount: 250, // $2.50 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/my-listings?cancelled=true`,
      metadata: {
        userId: userId,
        listingTitle: listingTitle,
        listingId: listingId,
        isReactivation: 'true', // Flag to identify reactivation flow
      },
      customer_email: userEmail,
    });

    console.log('✅ Stripe reactivation session created:', session.id);
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url // Return URL for redirect
    });
  } catch (error) {
    console.error('❌ Error creating reactivation checkout session:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create reactivation checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
