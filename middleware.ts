import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Создаём Supabase middleware клиент с поддержкой cookies
  const supabase = createMiddlewareClient({ req, res })

  // Обновим сессию, если нужно (refresh token и т.п.)
  await supabase.auth.getSession()

  // Агрессивные no-cache заголовки для решения проблемы подвисания
  res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  res.headers.set('Last-Modified', new Date().toUTCString())

  return res
}

// Применяем middleware ко всем путям
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
