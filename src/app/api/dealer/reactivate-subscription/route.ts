import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      .select('stripe_subscription_id, cancel_at_period_end')
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
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    if (!dealer.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      )
    }

    // Reactivate subscription (remove cancellation)
    await stripe.subscriptions.update(
      dealer.stripe_subscription_id,
      {
        cancel_at_period_end: false
      }
    )

    // Update database
    await supabaseAdmin
      .from('dealers')
      .update({
        cancel_at_period_end: false,
        cancellation_scheduled_for: null
      })
      .eq('user_id', userId)

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully'
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
