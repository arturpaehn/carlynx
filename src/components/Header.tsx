'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

export default function Header() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    router.refresh()
  }

  const user = session?.user
  const fullName = user?.user_metadata?.full_name || user?.email

  return (
    <header className="bg-[#ffe6cc] shadow border-b">
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        {/* Логотип */}
        <Link href="/">
          <img
            src="/logo.png"
            alt="CarLynx Logo"
            className="h-32 w-auto"
          />
        </Link>

        {/* Приветствие и кнопки */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <>
              <span className="text-gray-800 text-sm font-medium">
                Hi, {fullName}
              </span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow disabled:opacity-50 text-sm"
              >
                {loading ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
