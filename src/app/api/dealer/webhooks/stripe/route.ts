import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-09-30.clover'
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_DEALER!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`[Dealer Webhook] Event type: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      default:
        console.log(`[Dealer Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Dealer Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const tierId = session.metadata?.tier_id

  if (!userId || !tierId) {
    console.error('[Checkout Completed] Missing metadata:', session.metadata)
    return
  }

  console.log(`[Checkout Completed] User: ${userId}, Tier: ${tierId}`)

  // Subscription will be created via subscription.created event
  // Just log for now
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  const tierId = subscription.metadata?.tier_id

  if (!userId || !tierId) {
    console.error('[Subscription Created] Missing metadata:', subscription.metadata)
    return
  }

  console.log(`[Subscription Created] User: ${userId}, Subscription: ${subscription.id}`)

  const status = subscription.status === 'trialing' ? 'trial' : subscription.status === 'active' ? 'active' : 'inactive'
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
  const subAny = subscription as any // eslint-disable-line @typescript-eslint/no-explicit-any

  // Update dealer subscription
  const { error } = await supabaseAdmin
    .from('dealers')
    .update({
      stripe_subscription_id: subscription.id,
      current_tier_id: tierId,
      subscription_status: status,
      trial_end_date: trialEnd,
      subscription_start_date: subAny.current_period_start ? new Date(subAny.current_period_start * 1000).toISOString() : new Date().toISOString(),
      subscription_end_date: subAny.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null
    })
    .eq('user_id', userId)

  if (error) {
    console.error('[Subscription Created] DB update error:', error)
  } else {
    console.log(`[Subscription Created] Updated dealer ${userId} to ${status}`)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    // Try to find user by stripe subscription ID
    const { data: dealer } = await supabaseAdmin
      .from('dealers')
      .select('user_id, current_tier_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (!dealer) {
      console.error('[Subscription Updated] Cannot find dealer for subscription:', subscription.id)
      return
    }
  }

  console.log(`[Subscription Updated] Subscription: ${subscription.id}, Status: ${subscription.status}`)

  let status: 'trial' | 'active' | 'past_due' | 'canceled' | 'inactive'
  switch (subscription.status) {
    case 'trialing':
      status = 'trial'
      break
    case 'active':
      status = 'active'
      break
    case 'past_due':
      status = 'past_due'
      break
    case 'canceled':
    case 'unpaid':
      status = 'canceled'
      break
    default:
      status = 'inactive'
  }

  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
  const subAny = subscription as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const cancelAtPeriodEnd = subAny.cancel_at_period_end || false
  const cancelAt = subAny.cancel_at ? new Date(subAny.cancel_at * 1000).toISOString() : null

  // Update subscription status
  const { error } = await supabaseAdmin
    .from('dealers')
    .update({
      subscription_status: status,
      trial_end_date: trialEnd,
      subscription_start_date: subAny.current_period_start ? new Date(subAny.current_period_start * 1000).toISOString() : new Date().toISOString(),
      subscription_end_date: subAny.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: cancelAtPeriodEnd,
      cancellation_scheduled_for: cancelAt
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('[Subscription Updated] DB update error:', error)
  } else {
    console.log(`[Subscription Updated] Status updated to ${status}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Subscription Deleted] Subscription: ${subscription.id}`)

  // Mark subscription as canceled
  const { error } = await supabaseAdmin
    .from('dealers')
    .update({
      subscription_status: 'canceled',
      subscription_end_date: new Date().toISOString(),
      cancel_at_period_end: false,
      cancellation_scheduled_for: null
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('[Subscription Deleted] DB update error:', error)
  } else {
    console.log(`[Subscription Deleted] Marked as canceled`)
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log(`[Trial Will End] Subscription: ${subscription.id}`)
  
  // Could send email notification here
  // For now just log
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceAny = invoice as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const subscriptionId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id

  if (!subscriptionId) return

  console.log(`[Payment Failed] Subscription: ${subscriptionId}`)

  // Mark subscription as past_due
  const { error } = await supabaseAdmin
    .from('dealers')
    .update({
      subscription_status: 'past_due'
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('[Payment Failed] DB update error:', error)
  } else {
    console.log(`[Payment Failed] Marked as past_due`)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceAny = invoice as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const subscriptionId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id

  if (!subscriptionId) return

  console.log(`[Payment Succeeded] Subscription: ${subscriptionId}`)

  // Ensure status is active (if was past_due)
  const { error } = await supabaseAdmin
    .from('dealers')
    .update({
      subscription_status: 'active'
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('[Payment Succeeded] DB update error:', error)
  } else {
    console.log(`[Payment Succeeded] Status updated to active`)
  }
}
