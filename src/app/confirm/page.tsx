'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const access_token = searchParams?.get('access_token') || '';
    const refresh_token = searchParams?.get('refresh_token') || '';
    if (access_token) {
      supabase.auth
        .setSession({
          access_token,
          refresh_token,
        })
        .then(() => {
          setMessage('Email confirmed! Redirecting...')
          setTimeout(() => router.push('/'), 1500)
        })
    } else {
      setTimeout(() => setMessage('Email confirmed! Please log in.'), 1500)
    }
  }, [router, searchParams])

  return (
    <main className="min-h-screen bg-[#fff2e0] pt-40 mt-[-40px] flex items-center justify-center px-2 sm:px-0">
      <div className="max-w-md mx-auto bg-white shadow p-3 sm:p-6 rounded text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">Email Verified</h1>
        <p className="text-gray-700 text-xs sm:text-base">{message}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 sm:mt-6 bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded transition w-full sm:w-auto"
        >
          Go to Login
        </button>
      </div>
    </main>
  )
}
