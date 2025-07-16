'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
  }

  return (
    <main className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Register
        </button>
      </form>
    </main>
  )
}
