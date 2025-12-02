import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover'
  })
}

/**
 * POST /api/dealercenter/activate
 * 
 * Create Stripe subscription for dealer activation
 * 
 * Request body:
 * {
 *   "activation_token": "abc123xyz",
 *   "tier_id": 2
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "checkout_url": "https://checkout.stripe.com/..."
 * }
 */

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin()
  const stripe = getStripe()

  try {
    const { activation_token, tier_id } = await req.json()

    if (!activation_token) {
      return NextResponse.json(
        { error: 'Missing activation_token' },
        { status: 400 }
      )
    }

    if (!tier_id) {
      return NextResponse.json(
        { error: 'Missing tier_id' },
        { status: 400 }
      )
    }

    // Get dealer info
    const { data: dealer, error: dealerError } = await supabase
      .from('dealercenter_dealers')
      .select('*')
      .eq('activation_token', activation_token)
      .single()

    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Invalid activation token' },
        { status: 404 }
      )
    }

    // Check if already activated
    if (dealer.subscription_status === 'active') {
      return NextResponse.json(
        { error: 'Dealer already activated' },
        { status: 400 }
      )
    }

    // Get tier info
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('tier_id, tier_name, monthly_price, listing_limit, stripe_price_id')
      .eq('tier_id', tier_id)
      .single()

    if (tierError || !tier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      )
    }

    // Create or get Stripe customer
    let customerId = dealer.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dealer.contact_email,
        name: dealer.dealer_name,
        phone: dealer.contact_phone || undefined,
        metadata: {
          dealercenter_dealer_id: dealer.id,
          activation_token: activation_token,
          source: 'dealercenter'
        }
      })

      customerId = customer.id

      // Update dealer with customer_id
      await supabase
        .from('dealercenter_dealers')
        .update({ stripe_customer_id: customerId })
        .eq('id', dealer.id)
    }

    // Get or create Stripe price for this tier
    let stripePriceId = tier.stripe_price_id

    if (!stripePriceId) {
      // Create recurring price in Stripe
      const product = await stripe.products.create({
        name: `CarLynx DealerCenter - ${tier.tier_name}`,
        description: `Up to ${tier.listing_limit || 'unlimited'} active listings`,
        metadata: {
          tier_id: tier.tier_id,
          tier_name: tier.tier_name
        }
      })

      const price = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: Math.round(parseFloat(tier.monthly_price.toString()) * 100), // Convert to cents
        recurring: {
          interval: 'month',
          interval_count: 1
        },
        metadata: {
          tier_id: tier.tier_id
        }
      })

      stripePriceId = price.id

      // Save price ID to database
      await supabase
        .from('subscription_tiers')
        .update({ stripe_price_id: stripePriceId })
        .eq('tier_id', tier.tier_id)
    }

    // Update dealer's tier
    await supabase
      .from('dealercenter_dealers')
      .update({ tier_id })
      .eq('id', dealer.id)

    // Create Stripe Checkout Session for recurring subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription', // RECURRING subscription
      line_items: [
        {
          price: stripePriceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealers/activate/${activation_token}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealers/activate/${activation_token}?canceled=true`,
      subscription_data: {
        metadata: {
          dealercenter_dealer_id: dealer.id,
          activation_token: activation_token,
          tier_id: tier_id,
          type: 'dealercenter_subscription'
        }
      },
      metadata: {
        dealercenter_dealer_id: dealer.id,
        activation_token: activation_token,
        tier_id: tier_id,
        type: 'dealercenter_activation'
      }
    })

    return NextResponse.json({
      success: true,
      checkout_url: session.url
    })
  } catch (error) {
    console.error('DealerCenter activation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription session' },
      { status: 500 }
    )
  }
}
