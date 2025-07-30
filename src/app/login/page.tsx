'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)


    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email && !password) {
      setError('Please enter your email and password.')
      return
    }
    if (!email) {
      setError('Please enter your email.')
      return
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)

    if (error) {
      // Supabase error codes: https://supabase.com/docs/reference/javascript/auth-signinwithpassword#errors
      const msg = error.message.toLowerCase()
      if (msg.includes('user not found') || msg.includes('email') || msg.includes('invalid login credentials')) {
        // Если email корректный, но пользователя нет или пароль не тот, выводим разные сообщения
        // Проверим, есть ли пользователь с таким email через signUp (без создания)
        setError('No account found with this email address or the password is incorrect.')
      } else {
        setError('Login failed. Please check your credentials and try again.')
      }
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen bg-[#fff2e0] pt-40 mt-[-40px] flex items-center justify-center px-2 sm:px-0">
      <div className="max-w-md w-full bg-white p-3 sm:p-6 rounded shadow">
        <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center text-gray-800">Sign In</h1>

        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 p-2 w-full rounded text-xs sm:text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 p-2 w-full rounded text-xs sm:text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="text-right text-xs sm:text-sm">
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 text-white px-4 py-2 rounded w-full hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm text-center animate-pulse">
              {error}
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
