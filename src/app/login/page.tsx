'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useSupabaseClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.refresh()
      router.push('/')
    }
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">Sign In</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </main>
  )
}
