import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { session_id, page_path, ip_hash, user_agent, referrer } = body

    // Validate required fields
    if (!session_id || !page_path || !ip_hash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false, autoRefreshToken: false }
      }
    )

    // Insert page visit record
    const { error } = await supabase
      .from('page_visits')
      .insert({
        session_id,
        page_path,
        ip_hash,
        user_agent: user_agent || null,
        referrer: referrer || null,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error inserting page visit:', error)
      return NextResponse.json(
        { error: 'Failed to record visit' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in track-visit endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
