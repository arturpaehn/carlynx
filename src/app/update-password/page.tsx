'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'


export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Проверяем токены из URL и устанавливаем сессию, если recovery
  useEffect(() => {
    const url = new URL(window.location.href);
    const type = url.searchParams.get('type');
    const access_token = url.searchParams.get('access_token');
    const refresh_token = url.searchParams.get('refresh_token');
    if (type === 'recovery' && access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token })
        .then(() => setSessionChecked(true))
        .catch(() => setSessionChecked(true));
    } else {
      setSessionChecked(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      router.push('/login')
    }
  }

  if (!sessionChecked) {
    return (
      <main className="max-w-md mx-auto pt-40 mt-[-40px] px-2 sm:px-4 text-center min-h-screen flex flex-col justify-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Set New Password</h1>
        <div className="text-orange-600">Checking session...</div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto pt-40 mt-[-40px] px-2 sm:px-4 text-center min-h-screen flex flex-col justify-center">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Set New Password</h1>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <input
          type="password"
          placeholder="New password"
          className="w-full border px-2 sm:px-3 py-2 rounded text-xs sm:text-base"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 w-full disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        {error && <p className="text-red-600 text-xs sm:text-sm">{error}</p>}
        {success && <p className="text-green-600 text-xs sm:text-sm">Password updated!</p>}
      </form>
    </main>
  )
}
