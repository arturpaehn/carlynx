'use client'

import { useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      setLoading(true)
      const { data } = await supabase.auth.getUser()
      const email = data?.user?.email
      setIsAdmin(email === 'admin@carlynx.us')
      setLoading(false)
    }
    checkAdmin()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center text-lg text-gray-600 font-bold border-2 border-gray-200 bg-white rounded shadow-lg">
          Checking access...
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center text-lg text-red-600 font-bold border-2 border-red-300 bg-white rounded shadow-lg">
          Access denied. This page is for administrators only.
        </div>
      </div>
    )
  }

  return (
    <div className="px-2 sm:px-8 pt-header">
      <div className="mb-4">
        <Link
          href="/admin"
          className="inline-block px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-150 text-xs sm:text-base"
        >
          ← Back to admin panel
        </Link>
      </div>
      {title && <h2 className="text-xl sm:text-2xl font-bold mb-4">{title}</h2>}
      {children}
    </div>
  )
}
