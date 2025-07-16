import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Создаём Supabase middleware клиент с поддержкой cookies
  const supabase = createMiddlewareClient({ req, res })

  // Обновим сессию, если нужно (refresh token и т.п.)
  await supabase.auth.getSession()

  return res
}

// Применяем middleware ко всем путям
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
