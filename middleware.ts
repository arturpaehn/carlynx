import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Bot detection - common bot user agents
const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
  'mechanize', 'golang', 'java', 'perl', 'ruby', 'php', 'nodejs',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'whatsapp', 'telegram', 'viber', 'skype', 'slack'
]

function isBot(userAgent: string): boolean {
  if (!userAgent) return false
  const lowerUA = userAgent.toLowerCase()
  return BOT_USER_AGENTS.some(bot => lowerUA.includes(bot))
}

function hashIp(ip: string): string {
  // Simple hash without crypto module for Edge Runtime compatibility
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

async function recordPageVisit(req: NextRequest, pathname: string) {
  try {
    // Get IP address
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    
    const userAgent = req.headers.get('user-agent') || ''
    const referrer = req.headers.get('referer') || ''
    
    // Skip if bot
    if (isBot(userAgent)) {
      return
    }
    
    // Skip API and static routes
    if (pathname.startsWith('/api/') || 
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/public/') ||
        pathname.includes('.')) {
      return
    }
    
    // Generate or get session ID from cookie
    let sessionId = req.cookies.get('carlynx_session_id')?.value
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    }
    
    // Record visit (async, non-blocking)
    const data = {
      session_id: sessionId,
      page_path: pathname,
      ip_hash: hashIp(ip),
      user_agent: userAgent.substring(0, 500),
      referrer: referrer.substring(0, 500)
    }
    
    // Send to API route (fire and forget)
    fetch(`${req.nextUrl.origin}/api/track-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {
      // Silently fail - don't block page load
    })
  } catch (error) {
    console.error('Error recording page visit:', error)
  }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Create Supabase middleware client with cookies support
  const supabase = createMiddlewareClient({ req, res })

  // Update session if needed (refresh token etc.)
  await supabase.auth.getSession()

  // Record page visit (non-blocking)
  recordPageVisit(req, pathname)

  // Smart caching strategy with proper Cache-Control headers
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
