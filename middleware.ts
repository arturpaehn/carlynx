import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create Supabase middleware client with cookies support
  const supabase = createMiddlewareClient({ req, res })

  // Update session if needed (refresh token etc.)
  await supabase.auth.getSession()

  // CORRECT STRATEGY: stale-while-revalidate
  // Allows caching with intelligent revalidation
  const pathname = req.nextUrl.pathname;
  
  // For API and dynamic data - minimal caching
  if (pathname.startsWith('/api/') || pathname.includes('/listing/') || pathname.includes('/search-')) {
    res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate, stale-while-revalidate=30')
  } 
  // For static pages - moderate caching
  else {
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  }

  return res
}

// Apply middleware to all paths except static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
