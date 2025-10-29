import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ISR Configuration: Revalidate every 60 seconds
export const revalidate = 60

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Fetch both regular and external listings in parallel
    const [listingsResult, externalResult] = await Promise.all([
      supabase
        .from('listings')
        .select(`
          id,
          title,
          model,
          year,
          price,
          state_id,
          city_id,
          city_name,
          created_at,
          states!inner (name, code, country_code),
          cities (name),
          listing_images (image_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12),
      
      supabase
        .from('external_listings')
        .select(`
          id,
          title,
          model,
          year,
          price,
          state_id,
          city_id,
          city_name,
          image_url,
          source,
          external_url,
          created_at,
          states (name, code, country_code)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50)
    ])

    if (listingsResult.error) {
      console.error('Error fetching listings:', listingsResult.error)
      throw listingsResult.error
    }

    // Format regular listings
    const formatted = (listingsResult.data || []).map((item) => {
      let stateObj: { name: string; code: string; country_code: string } | null = null
      if (item.states) {
        if (Array.isArray(item.states) && item.states.length > 0 && typeof item.states[0] === 'object') {
          const s = item.states[0] as { name: string; code: string; country_code: string }
          stateObj = {
            name: s.name,
            code: s.code,
            country_code: s.country_code,
          }
        } else if (typeof item.states === 'object' && 'name' in item.states && !Array.isArray(item.states)) {
          const s = item.states as unknown as { name: string; code: string; country_code: string }
          stateObj = {
            name: s.name,
            code: s.code,
            country_code: s.country_code,
          }
        }
      }

      let city: string | null = null
      if (item.city_name && item.city_name.trim()) {
        city = item.city_name.trim()
      } else if (item.cities) {
        if (Array.isArray(item.cities) && item.cities[0]?.name) {
          city = item.cities[0].name
        } else if (typeof item.cities === 'object' && 'name' in item.cities) {
          const c = item.cities as { name: string }
          city = c.name
        }
      }

      return {
        id: item.id,
        title: item.title,
        model: item.model ?? '',
        year: item.year ?? undefined,
        price: item.price,
        created_at: item.created_at,
        state: stateObj,
        city,
        image_url: Array.isArray(item.listing_images) && item.listing_images[0]?.image_url
          ? item.listing_images[0].image_url
          : undefined,
      }
    })

    // Format external listings
    const formattedExternal = (externalResult.data || []).map((item) => {
      let stateObj: { name: string; code: string; country_code: string } | null = null
      if (item.states) {
        if (Array.isArray(item.states) && item.states.length > 0 && typeof item.states[0] === 'object') {
          const s = item.states[0] as { name: string; code: string; country_code: string }
          stateObj = {
            name: s.name,
            code: s.code,
            country_code: s.country_code,
          }
        } else if (typeof item.states === 'object' && 'name' in item.states && !Array.isArray(item.states)) {
          const s = item.states as unknown as { name: string; code: string; country_code: string }
          stateObj = {
            name: s.name,
            code: s.code,
            country_code: s.country_code,
          }
        }
      }

      return {
        id: `ext-${item.id}`,
        title: item.title,
        model: item.model ?? '',
        year: item.year ?? undefined,
        price: item.price,
        created_at: item.created_at,
        state: stateObj,
        city: item.city_name,
        image_url: item.image_url,
        is_external: true,
        external_source: item.source,
        external_url: item.external_url,
      }
    })

    // Combine and sort by created_at (newest first)
    const allListings = [...formatted, ...formattedExternal]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12)

    return NextResponse.json(
      { 
        listings: allListings,
        timestamp: new Date().toISOString(),
        version: '1.0.0' // API version for cache busting
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-API-Version': '1.0.0'
        }
      }
    )
  } catch (error) {
    console.error('Homepage API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch listings',
        listings: []
      },
      { status: 500 }
    )
  }
}
