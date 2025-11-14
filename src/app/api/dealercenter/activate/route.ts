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
 * Create Stripe payment for dealer activation
 * 
 * Request body:
 * {
 *   "activation_token": "abc123xyz"
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
    const { activation_token } = await req.json()

    if (!activation_token) {
      return NextResponse.json(
        { error: 'Missing activation_token' },
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
      .select('tier_name, monthly_price, listing_limit')
      .eq('tier_id', dealer.tier_id)
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

    // Create Stripe Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment', // One-time payment, not subscription
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `CarLynx DealerCenter - ${tier.tier_name}`,
              description: `30 days access | Up to ${tier.listing_limit || 'Unlimited'} listings`
            },
            unit_amount: Math.round(tier.monthly_price * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealers/activate/${activation_token}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealers/activate/${activation_token}?canceled=true`,
      metadata: {
        dealercenter_dealer_id: dealer.id,
        activation_token: activation_token,
        tier_id: dealer.tier_id,
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
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
