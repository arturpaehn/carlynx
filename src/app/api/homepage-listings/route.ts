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
    // Get latest listings (no time filter), then filter by minimum 2 images
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
          vehicle_type,
          user_id,
          states!inner (name, code, country_code),
          cities (name),
          listing_images (image_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1000), // Fetch more to filter by image count
      
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
          image_url_2,
          image_url_3,
          image_url_4,
          source,
          external_url,
          created_at,
          vehicle_type,
          states (name, code, country_code)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1000)
    ])

    if (listingsResult.error) {
      console.error('Error fetching listings:', listingsResult.error)
      throw listingsResult.error
    }

    // Format regular listings
    const formatted = (listingsResult.data || [])
      .filter((item) => {
        // Filter: must have at least 2 images
        const imageCount = Array.isArray(item.listing_images) ? item.listing_images.length : 0
        return imageCount >= 2
      })
      .map((item) => {
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
          vehicle_type: item.vehicle_type || 'car',
          state: stateObj,
          city,
          image_url: Array.isArray(item.listing_images) && item.listing_images[0]?.image_url
            ? item.listing_images[0].image_url
            : undefined,
          user_id: item.user_id,
          user_type: 'individual', // Default, will update below
        }
      })

    // Get user_type for all listings in one query
    if (formatted.length > 0) {
      const userIds = formatted.map(item => item.user_id).filter(Boolean)
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, user_type')
          .in('user_id', userIds)
        
        if (profiles) {
          const profileMap = new Map(profiles.map(p => [p.user_id, p.user_type]))
          formatted.forEach(item => {
            if (item.user_id) {
              item.user_type = profileMap.get(item.user_id) || 'individual'
            }
          })
        }
      }
    }

    // Format external listings
    const formattedExternal = (externalResult.data || [])
      .filter((item) => {
        // Filter: must have at least 2 images
        let imageCount = 0
        if (item.image_url) imageCount++
        if (item.image_url_2) imageCount++
        if (item.image_url_3) imageCount++
        if (item.image_url_4) imageCount++
        return imageCount >= 2
      })
      .map((item) => {
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
          vehicle_type: item.vehicle_type || 'car',
          state: stateObj,
          city: item.city_name,
          image_url: item.image_url,
          is_external: true,
          external_source: item.source,
          external_url: item.external_url,
        }
      })

    // Combine all listings
    const allListings = [...formatted, ...formattedExternal]

    // Separate cars and motorcycles
    const cars = allListings.filter(item => item.vehicle_type === 'car')
    const motorcycles = allListings.filter(item => item.vehicle_type === 'motorcycle')

    // Shuffle arrays randomly
    const shuffleCars = cars.sort(() => Math.random() - 0.5)
    const shuffleMotorcycles = motorcycles.sort(() => Math.random() - 0.5)

    // Select 8 cars and 4 motorcycles (or fill with cars if not enough motorcycles)
    const selectedCars = shuffleCars.slice(0, 8)
    const selectedMotorcycles = shuffleMotorcycles.slice(0, 4)
    
    // If not enough motorcycles, fill the rest with cars
    const remainingSlots = 12 - selectedCars.length - selectedMotorcycles.length
    const additionalCars = remainingSlots > 0 ? shuffleCars.slice(8, 8 + remainingSlots) : []

    // Combine and shuffle the final selection randomly
    const finalSelection = [...selectedCars, ...selectedMotorcycles, ...additionalCars]
      .sort(() => Math.random() - 0.5)
      .slice(0, 12)

    return NextResponse.json(
      { 
        listings: finalSelection,
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
