import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * GET /api/subscription-tiers
 * 
 * Fetch available subscription tiers
 */
export async function GET() {
  const supabase = getSupabaseAdmin()

  try {
    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ tiers })

  } catch (error) {
    console.error('Failed to fetch subscription tiers:', error)
    return NextResponse.json(
      { error: 'Failed to load subscription tiers' },
      { status: 500 }
    )
  }
}
