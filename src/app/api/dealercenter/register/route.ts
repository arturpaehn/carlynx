import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/dealercenter/register
 * 
 * DealerCenter sends dealer info to create activation token
 * 
 * Request body:
 * {
 *   "dealer_name": "John's Auto Sales",
 *   "contact_email": "john@autosales.com",
 *   "contact_phone": "+1234567890",
 *   "tier_id": "uuid-of-selected-tier",
 *   "notes": "Optional notes from DealerCenter"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "activation_token": "abc123xyz",
 *   "activation_url": "https://carlynx.us/dealers/activate/abc123xyz"
 * }
 */

// Secret key for DealerCenter API authentication
const DEALERCENTER_API_KEY = process.env.DEALERCENTER_API_KEY || ''

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin()

  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey || apiKey !== DEALERCENTER_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { dealer_name, contact_email, contact_phone, tier_id, notes } = body

    // Validate required fields
    if (!dealer_name || !contact_email || !tier_id) {
      return NextResponse.json(
        { error: 'Missing required fields: dealer_name, contact_email, tier_id' },
        { status: 400 }
      )
    }

    // Validate tier exists
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('tier_id, tier_name, monthly_price, listing_limit')
      .eq('tier_id', tier_id)
      .eq('active', true)
      .single()

    if (tierError || !tier) {
      return NextResponse.json(
        { error: 'Invalid tier_id or tier is not active' },
        { status: 400 }
      )
    }

    // Generate unique activation token
    const activation_token = generateActivationToken()

    // Insert dealer
    const { data: dealer, error: insertError } = await supabase
      .from('dealercenter_dealers')
      .insert({
        activation_token,
        dealer_name,
        contact_email,
        contact_phone,
        tier_id,
        max_listings: tier.listing_limit,
        subscription_status: 'pending',
        notes
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating DealerCenter dealer:', insertError)
      return NextResponse.json(
        { error: 'Failed to create dealer registration' },
        { status: 500 }
      )
    }

    // Generate activation URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carlynx.us'
    const activation_url = `${baseUrl}/dealers/activate/${activation_token}`

    // TODO: Send welcome email with activation link
    // await sendDealerCenterWelcomeEmail(contact_email, dealer_name, activation_url, tier)

    return NextResponse.json({
      success: true,
      dealer_id: dealer.id,
      activation_token,
      activation_url,
      tier: {
        name: tier.tier_name,
        price: tier.monthly_price,
        listing_limit: tier.listing_limit
      }
    })
  } catch (error) {
    console.error('DealerCenter registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate random activation token
 * Format: 16 characters, alphanumeric
 */
function generateActivationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
