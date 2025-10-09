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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Get dealer subscription
    const { data: dealer, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('stripe_subscription_id, subscription_status')
      .eq('user_id', userId)
      .single()

    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }

    if (!dealer.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    if (dealer.subscription_status === 'canceled' || dealer.subscription_status === 'inactive') {
      return NextResponse.json(
        { error: 'Subscription already canceled' },
        { status: 400 }
      )
    }

    // Cancel subscription at period end (soft cancellation)
    const subscription = await stripe.subscriptions.update(
      dealer.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    )

    // Update database
    const subAny = subscription as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const cancelAt = subAny.cancel_at ? new Date(subAny.cancel_at * 1000).toISOString() : null

    await supabaseAdmin
      .from('dealers')
      .update({
        cancel_at_period_end: true,
        cancellation_scheduled_for: cancelAt
      })
      .eq('user_id', userId)

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: cancelAt
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
