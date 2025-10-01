import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Создаём Supabase middleware клиент с поддержкой cookies
  const supabase = createMiddlewareClient({ req, res })

  // Обновим сессию, если нужно (refresh token и т.п.)
  await supabase.auth.getSession()

  // Умные заголовки кеширования: позволяем кешировать с ревалидацией
  // stale-while-revalidate позволяет показывать старую версию пока загружается новая
  const pathname = req.nextUrl.pathname;
  
  // Для API и динамических данных - минимальное кеширование
  if (pathname.startsWith('/api/') || pathname.includes('/listing/') || pathname.includes('/search-')) {
    res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate, stale-while-revalidate=30')
  } 
  // Для статических страниц - умеренное кеширование
  else {
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  }

  return res
}

// Применяем middleware ко всем путям
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
