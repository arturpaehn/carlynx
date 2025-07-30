'use client'


import { useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default function RegisterPage() {
  const supabase = createBrowserSupabaseClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validatePhone = (phone: string) =>
    /^\+?[0-9]{7,15}$/.test(phone)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      setError('Name can only contain English letters and spaces.')
      return
    }

    if (!validateEmail(email)) {
      setError('Invalid email address.')
      return
    }

    if (!validatePhone(phone)) {
      setError('Invalid phone number.')
      return
    }

    if (password.length < 7) {
      setError('Password must be at least 7 characters.')
      return
    }

    setLoading(true)

    try {
      const { data, error: lookupError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle()

      if (lookupError) {
        console.warn('User lookup failed:', lookupError.message)
      }

      if (data) {
        setError('An account with this email already exists. Try logging in.')
        setLoading(false)
        return
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            phone: phone,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
      } else if (signUpData?.user?.id) {
        // Insert profile row
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: signUpData.user.id,
            name: fullName,
            phone: phone,
            email: email,
          })
        if (profileError) {
          setError('Registration succeeded, but failed to save profile: ' + profileError.message)
        } else {
          setSuccess(true)
        }
      } else {
        setError('Registration succeeded, but user ID not found.')
      }
    } catch {
      setError('Unexpected error occurred. Please try again later.')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#fff2e0] pt-40 mt-[-40px] flex items-center justify-center px-2 sm:px-0">
      <div className="max-w-md w-full bg-white p-3 sm:p-6 rounded shadow">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center text-gray-800">Register</h1>

        {success ? (
          <p className="text-green-600 text-center">
            Confirmation email sent. Please check your inbox.
          </p>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border px-2 sm:px-3 py-2 rounded text-xs sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border px-2 sm:px-3 py-2 rounded text-xs sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border px-2 sm:px-3 py-2 rounded text-xs sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border px-2 sm:px-3 py-2 rounded text-xs sm:text-base"
                required
              />
            </div>

            {error && <p className="text-red-600 text-xs sm:text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
