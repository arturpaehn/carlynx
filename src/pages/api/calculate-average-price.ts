import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { brand, model, year, vehicleType } = req.body

  // Validation
  if (!brand || !model || !year) {
    return res.status(400).json({ message: 'Brand, model, and year are required' })
  }

  if (typeof brand !== 'string' || typeof model !== 'string' || typeof year !== 'number') {
    return res.status(400).json({ message: 'Invalid data format' })
  }

  try {
    // Search in regular listings table
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('price')
      .ilike('title', `%${brand}%`)
      .ilike('model', `%${model}%`)
      .eq('year', year)
      .eq('vehicle_type', vehicleType || 'car')
      .eq('is_active', true)
      .not('price', 'is', null)
      .gt('price', 0)

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
    }

    // Search in external_listings table
    const { data: externalData, error: externalError } = await supabase
      .from('external_listings')
      .select('price')
      .or(`make.ilike.%${brand}%,title.ilike.%${brand}%`)
      .ilike('model', `%${model}%`)
      .eq('year', year)
      .eq('vehicle_type', vehicleType || 'car')
      .eq('is_active', true)
      .not('price', 'is', null)
      .gt('price', 0)

    if (externalError) {
      console.error('Error fetching external listings:', externalError)
    }

    // Combine results
    const allListings = [
      ...(listingsData || []),
      ...(externalData || [])
    ]

    if (allListings.length === 0) {
      return res.status(200).json({
        averagePrice: 0,
        count: 0,
        message: 'No listings found'
      })
    }

    // Calculate average price
    const prices = allListings.map(listing => Number(listing.price))
    const sum = prices.reduce((acc, price) => acc + price, 0)
    const averagePrice = Math.round(sum / prices.length)

    console.log(`✅ Average price calculated for ${brand} ${model} ${year}:`, {
      averagePrice,
      count: allListings.length,
      vehicleType
    })

    return res.status(200).json({
      averagePrice,
      count: allListings.length
    })
  } catch (error) {
    console.error('Error calculating average price:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
