import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create Supabase middleware client with cookies support
  const supabase = createMiddlewareClient({ req, res })

  // Update session if needed (refresh token etc.)
  await supabase.auth.getSession()

  // Smart caching strategy with proper Cache-Control headers
  const pathname = req.nextUrl.pathname;
  
  // API routes - short cache with revalidation
  if (pathname.startsWith('/api/')) {
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  }
  // Dynamic listing pages - minimal cache
  else if (pathname.includes('/listing/') || pathname.includes('/search-')) {
    res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
  }
  // Static pages (homepage, terms, etc) - longer cache
  else {
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  }

  return res
}

// Apply middleware to all paths except static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
