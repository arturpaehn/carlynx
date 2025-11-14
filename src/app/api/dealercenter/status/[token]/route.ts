import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * GET /api/dealercenter/status/[token]
 * 
 * Check dealer subscription status and usage
 * 
 * Public endpoint - no API key required (used by activation page)
 * 
 * Response:
 * {
 *   "dealer_name": "John's Auto Sales",
 *   "contact_email": "john@autosales.com",
 *   "subscription_status": "active",
 *   "tier_name": "Professional",
 *   "max_listings": 500,
 *   "active_listings_count": 125,
 *   "activation_date": "2025-01-13T10:00:00Z",
 *   "expiration_date": "2025-02-12T10:00:00Z",
 *   "days_remaining": 30
 * }
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = getSupabaseAdmin()

  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      )
    }

    // Get dealer info
    const { data: dealer, error: dealerError } = await supabase
      .from('dealercenter_dealers')
      .select(`
        id,
        dealer_name,
        contact_email,
        contact_phone,
        subscription_status,
        tier_id,
        max_listings,
        activation_date,
        expiration_date,
        created_at
      `)
      .eq('activation_token', token)
      .single()

    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Dealer not found with this token' },
        { status: 404 }
      )
    }

    // Get tier info
    let tierInfo = null
    if (dealer.tier_id) {
      const { data: tier } = await supabase
        .from('subscription_tiers')
        .select('tier_name, monthly_price, listing_limit')
        .eq('tier_id', dealer.tier_id)
        .single()
      
      tierInfo = tier
    }

    // Count active listings
    const { count: activeCount } = await supabase
      .from('external_listings')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'dealercenter')
      .like('external_id', `DC-${token}-%`)
      .eq('is_active', true)

    // Calculate days remaining
    let daysRemaining = null
    if (dealer.expiration_date) {
      const now = new Date()
      const expiration = new Date(dealer.expiration_date)
      const diffTime = expiration.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      dealer_name: dealer.dealer_name,
      contact_email: dealer.contact_email,
      contact_phone: dealer.contact_phone,
      subscription_status: dealer.subscription_status,
      tier: tierInfo ? {
        name: tierInfo.tier_name,
        price: tierInfo.monthly_price,
        listing_limit: tierInfo.listing_limit
      } : null,
      max_listings: dealer.max_listings,
      active_listings_count: activeCount || 0,
      activation_date: dealer.activation_date,
      expiration_date: dealer.expiration_date,
      days_remaining: daysRemaining,
      created_at: dealer.created_at
    })
  } catch (error) {
    console.error('DealerCenter status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
