import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Создаём Supabase middleware клиент с поддержкой cookies
  const supabase = createMiddlewareClient({ req, res })

  // Обновим сессию, если нужно (refresh token и т.п.)
  await supabase.auth.getSession()

  // Добавляем заголовки для предотвращения кеширования динамического контента
  res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')

  return res
}

// Применяем middleware ко всем путям
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
