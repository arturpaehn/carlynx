import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false, autoRefreshToken: false }
      }
    )

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'day' // day, month, all

    let query = supabase
      .from('page_visits')
      .select('*', { count: 'exact' })

    const now = new Date()

    // Apply time filter based on period
    switch (period) {
      case 'day':
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', dayAgo)
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', monthAgo)
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', weekAgo)
        break
      // 'all' has no time filter
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalVisits = count || 0
    const uniqueVisitors = new Set((data || []).map((v: any) => v.session_id)).size
    const uniqueIPs = new Set((data || []).map((v: any) => v.ip_hash)).size

    // Get top pages
    const topPages: Record<string, number> = {}
    ;(data || []).forEach((v: any) => {
      topPages[v.page_path] = (topPages[v.page_path] || 0) + 1
    })

    const topPagesArray = Object.entries(topPages)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json(
      {
        period,
        timestamp: new Date().toISOString(),
        stats: {
          totalVisits,
          uniqueVisitors,
          uniqueIPs,
          topPages: topPagesArray
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in analytics endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
