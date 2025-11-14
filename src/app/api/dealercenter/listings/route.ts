import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/dealercenter/listings
 * 
 * DealerCenter sends batch of listings for a dealer
 * 
 * Request body:
 * {
 *   "activation_token": "abc123xyz",
 *   "listings": [
 *     {
 *       "external_id": "listing-123",
 *       "title": "2020 Honda Accord",
 *       "year": 2020,
 *       "make": "Honda",
 *       "model": "Accord",
 *       "price": 25000,
 *       "mileage": 30000,
 *       "transmission": "Automatic",
 *       "fuel_type": "Gasoline",
 *       "vin": "1HGCV1F3XLA123456",
 *       "description": "Excellent condition",
 *       "vehicle_type": "car",
 *       "image_urls": ["https://...", "https://..."],
 *       "state_code": "TX",
 *       "city_name": "Dallas"
 *     }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "inserted": 5,
 *   "updated": 2,
 *   "errors": []
 * }
 */

const DEALERCENTER_API_KEY = process.env.DEALERCENTER_API_KEY || ''

interface DealerCenterListing {
  external_id: string
  title: string
  year: number
  brand?: string
  model?: string
  price: number
  mileage?: number
  transmission?: string
  fuel_type?: string
  vin?: string
  description?: string
  vehicle_type?: 'car' | 'motorcycle' | 'atv' | 'boat' | 'truck'
  engine_size?: string
  external_url?: string
  image_urls?: string[]
  state_code?: string
  city_name?: string
}

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
    const { activation_token, listings } = body as { activation_token: string; listings: DealerCenterListing[] }

    if (!activation_token || !Array.isArray(listings)) {
      return NextResponse.json(
        { error: 'Missing activation_token or listings array' },
        { status: 400 }
      )
    }

    // Verify dealer exists and is active
    const { data: dealer, error: dealerError } = await supabase
      .from('dealercenter_dealers')
      .select('id, subscription_status, max_listings, contact_phone, contact_email, expiration_date')
      .eq('activation_token', activation_token)
      .single()

    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Invalid activation token - dealer not found' },
        { status: 404 }
      )
    }

    if (dealer.subscription_status !== 'active') {
      return NextResponse.json(
        { error: `Dealer subscription is ${dealer.subscription_status}. Must be active.` },
        { status: 403 }
      )
    }

    // Check if subscription expired
    if (dealer.expiration_date && new Date(dealer.expiration_date) < new Date()) {
      return NextResponse.json(
        { error: 'Dealer subscription has expired' },
        { status: 403 }
      )
    }

    // Check listing limit
    const { count: currentCount } = await supabase
      .from('external_listings')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'dealercenter')
      .like('external_id', `DC-${activation_token}-%`)
      .eq('is_active', true)

    const activeCount = currentCount || 0

    if (dealer.max_listings !== null && activeCount + listings.length > dealer.max_listings) {
      return NextResponse.json(
        { 
          error: `Listing limit exceeded. Current: ${activeCount}, Limit: ${dealer.max_listings}, Trying to add: ${listings.length}` 
        },
        { status: 403 }
      )
    }

    let inserted = 0
    let updated = 0
    const errors: string[] = []
    const currentTime = new Date().toISOString()

    for (const listing of listings) {
      try {
        // Build external_id: DC-{token}-{listing_id}
        const fullExternalId = `DC-${activation_token}-${listing.external_id}`

        // Get state_id and city_id if provided
        let stateId = null
        let cityId = null

        if (listing.state_code) {
          const { data: stateData } = await supabase
            .from('states')
            .select('id')
            .eq('code', listing.state_code.toUpperCase())
            .single()
          
          stateId = stateData?.id || null

          // Get city_id if city_name provided
          if (stateId && listing.city_name) {
            const { data: cityData } = await supabase
              .from('cities')
              .select('id')
              .ilike('name', listing.city_name)
              .eq('state_id', stateId)
              .single()
            
            cityId = cityData?.id || null
          }
        }

        // Check if listing already exists
        const { data: existing } = await supabase
          .from('external_listings')
          .select('id, image_url, image_url_2, image_url_3, image_url_4')
          .eq('external_id', fullExternalId)
          .eq('source', 'dealercenter')
          .single()

        const listingData = {
          // Required fields
          source: 'dealercenter' as const,
          external_id: fullExternalId,
          title: listing.title,
          price: listing.price,
          year: listing.year,
          is_active: true,
          last_seen_at: currentTime,
          views: 0,
          // Optional vehicle details
          brand: listing.brand || null,
          model: listing.model || null,
          description: listing.description || null,
          mileage: listing.mileage || null,
          transmission: listing.transmission || null,
          fuel_type: listing.fuel_type || null,
          vehicle_type: listing.vehicle_type || 'car',
          vin: listing.vin || null,
          engine_size: listing.engine_size || null,
          // Location
          state_id: stateId,
          city_id: cityId,
          city_name: listing.city_name || null,
          // Contact info
          contact_phone: dealer.contact_phone,
          contact_email: dealer.contact_email,
          // External link
          external_url: listing.external_url || null,
          // Images (up to 4)
          image_url: listing.image_urls?.[0] || null,
          image_url_2: listing.image_urls?.[1] || null,
          image_url_3: listing.image_urls?.[2] || null,
          image_url_4: listing.image_urls?.[3] || null
        }

        if (existing) {
          // Update existing listing
          const { error: updateError } = await supabase
            .from('external_listings')
            .update(listingData)
            .eq('id', existing.id)

          if (updateError) {
            errors.push(`Failed to update ${listing.external_id}: ${updateError.message}`)
          } else {
            updated++
          }
        } else {
          // Insert new listing
          const { error: insertError } = await supabase
            .from('external_listings')
            .insert(listingData)

          if (insertError) {
            errors.push(`Failed to insert ${listing.external_id}: ${insertError.message}`)
          } else {
            inserted++
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Error processing ${listing.external_id}: ${errorMessage}`)
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      total_processed: listings.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('DealerCenter listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/dealercenter/listings
 * 
 * Remove specific listings or deactivate all for a dealer
 * 
 * Query params:
 * - token: activation_token (required)
 * - listing_ids: comma-separated external_ids (optional)
 * 
 * If listing_ids not provided, deactivates all dealer's listings
 */
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const listingIds = searchParams.get('listing_ids')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      )
    }

    // Verify dealer exists
    const { data: dealer, error: dealerError } = await supabase
      .from('dealercenter_dealers')
      .select('id')
      .eq('activation_token', token)
      .single()

    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Invalid token - dealer not found' },
        { status: 404 }
      )
    }

    let query = supabase
      .from('external_listings')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('source', 'dealercenter')

    if (listingIds) {
      // Deactivate specific listings
      const ids = listingIds.split(',').map(id => `DC-${token}-${id.trim()}`)
      query = query.in('external_id', ids)
    } else {
      // Deactivate all dealer's listings
      query = query.like('external_id', `DC-${token}-%`)
    }

    const { data, error } = await query.select()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to deactivate listings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deactivated: data?.length || 0
    })
  } catch (error) {
    console.error('DealerCenter delete listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
