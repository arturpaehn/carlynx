import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Supabase Admin client (with service role for webhooks)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('✅ Webhook received:', event.type);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('💳 Payment successful:', {
          sessionId: session.id,
          userId: session.metadata?.userId,
          amount: session.amount_total,
        });

        // Update payment record in database
        const { error } = await supabaseAdmin
          .from('individual_payments')
          .update({
            payment_status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_session_id: session.id,
            paid_at: new Date().toISOString(),
          })
          .eq('user_id', session.metadata?.userId)
          .is('stripe_session_id', null); // Only update if not already processed

        if (error) {
          console.error('❌ Failed to update payment record:', error);
        } else {
          console.log('✅ Payment record updated successfully');
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('✅ PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('❌ PaymentIntent failed:', failedIntent.id);

        // Update payment record to failed
        await supabaseAdmin
          .from('individual_payments')
          .update({ payment_status: 'failed' })
          .eq('stripe_payment_intent_id', failedIntent.id);

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        console.log('💸 Charge refunded:', charge.id);

        // Update payment record
        await supabaseAdmin
          .from('individual_payments')
          .update({
            payment_status: 'refunded',
            refunded_at: new Date().toISOString(),
          })
          .eq('stripe_charge_id', charge.id);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
