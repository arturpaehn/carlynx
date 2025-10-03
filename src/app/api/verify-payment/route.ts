import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        paymentIntentId: session.payment_intent,
        userId: session.metadata?.userId,
        listingTitle: session.metadata?.listingTitle,
        metadata: session.metadata, // Return full metadata including listingId
      });
    } else {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
