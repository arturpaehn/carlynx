'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMessage('Email confirmed! Please log in.')
    }, 1500)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <main className="min-h-screen bg-[#fff2e0] pt-[224px] mt-[-224px] flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white shadow p-6 rounded text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Email Verified</h1>
        <p className="text-gray-700">{message}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded transition"
        >
          Go to Login
        </button>
      </div>
    </main>
  )
}
