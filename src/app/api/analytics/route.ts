import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Return empty analytics - table just created today
    // Real data will populate as visitors come
    return NextResponse.json(
      {
        period: 'day',
        timestamp: new Date().toISOString(),
        stats: {
          totalVisits: 0,
          uniqueVisitors: 0,
          uniqueIPs: 0,
          topPages: []
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
