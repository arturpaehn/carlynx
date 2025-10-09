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
    const { userId, tierId } = await req.json()

    if (!userId || !tierId) {
      return NextResponse.json(
        { error: 'Missing userId or tierId' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, name, user_type')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (profile.user_type !== 'dealer') {
      return NextResponse.json(
        { error: 'Only dealers can subscribe' },
        { status: 403 }
      )
    }

    // Get tier details
    const { data: tier, error: tierError } = await supabaseAdmin
      .from('subscription_tiers')
      .select('*')
      .eq('tier_id', tierId)
      .eq('active', true)
      .single()

    if (tierError || !tier) {
      return NextResponse.json(
        { error: 'Subscription tier not found' },
        { status: 404 }
      )
    }

    // Check if dealer already has a Stripe customer ID
    const { data: dealer } = await supabaseAdmin
      .from('dealers')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('user_id', userId)
      .single()

    let customerId = dealer?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.name || undefined,
        metadata: {
          user_id: userId,
          user_type: 'dealer'
        }
      })
      customerId = customer.id

      // Save customer ID to dealers table
      await supabaseAdmin
        .from('dealers')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId)
    }

    // Cancel existing subscription if any
    if (dealer?.stripe_subscription_id && dealer.subscription_status !== 'canceled') {
      try {
        await stripe.subscriptions.cancel(dealer.stripe_subscription_id)
      } catch (err) {
        console.error('Error canceling old subscription:', err)
      }
    }

    // Create Stripe Checkout Session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      locale: 'auto', // Auto-detect language based on customer's IP address
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tier.tier_name.replace('tier_', 'Tier ').replace('_', ' ')} - ${tier.max_active_listings || 'Unlimited'} Listings`,
              description: `Monthly subscription for ${tier.max_active_listings || 'unlimited'} active listings`
            },
            recurring: {
              interval: 'month'
            },
            unit_amount: tier.monthly_price * 100 // Convert to cents
          },
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: userId,
          tier_id: tierId,
          tier_name: tier.tier_name
        }
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dealer/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dealer/subscription?canceled=true`,
      metadata: {
        user_id: userId,
        tier_id: tierId
      }
    })

    // Update dealer with trial status immediately
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    await supabaseAdmin
      .from('dealers')
      .update({
        current_tier_id: tierId,
        subscription_status: 'trial',
        trial_end_date: trialEndDate.toISOString()
      })
      .eq('user_id', userId)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
