'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for the password reset link (including spam).')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#fff2e0] pt-40 mt-[-40px] flex items-center justify-center px-2 sm:px-0">
      <div className="max-w-md w-full bg-white p-3 sm:p-6 rounded shadow text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">Forgot Password</h1>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <input
            type="email"
            placeholder="Your email"
            className="w-full border px-2 sm:px-3 py-2 rounded text-xs sm:text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 w-full disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          {error && <p className="text-red-600 text-xs sm:text-sm">{error}</p>}
          {message && <p className="text-green-600 text-xs sm:text-sm">{message}</p>}
        </form>
      </div>
    </main>
  )
}
