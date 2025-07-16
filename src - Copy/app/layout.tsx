import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import { cookies } from 'next/headers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CarLynx',
  description: 'Private car listings made simple.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient(cookies)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}>
        <header className="w-full border-b bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              CarLynx
            </Link>
            <nav>
              {user ? (
                <form action="/logout" method="post">
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Log out
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Log in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="min-h-screen max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
