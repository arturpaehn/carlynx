'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import type { User } from '@supabase/supabase-js'

export default function ProfilePage() {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session?.user) {
        router.push('/login')
        return
      }

      const currentUser = data.session.user
      setUser(currentUser)
      setName(currentUser.user_metadata?.name || '')
      setPhone(currentUser.user_metadata?.phone || '')
      setLoading(false)
    }

    fetchSession()
  }, [router, supabase])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        name: name.trim(),
        phone: phone.trim(),
      },
    })

    if (metaError) {
      setMessage('Error updating profile.')
      setSaving(false)
      return
    }

    if (password.trim()) {
      const { error: passError } = await supabase.auth.updateUser({
        password: password.trim(),
      })

      if (passError) {
        setMessage('Password update failed.')
        setSaving(false)
        return
      }
    }

    setMessage('Profile updated successfully!')
    setSaving(false)
  }

  if (loading) return <p className="text-center py-10">Loading profile...</p>

  return (
    <main className="bg-[#fff6ed] min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

        <label className="block mb-2">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </label>

        <label className="block mb-2 mt-4">
          <span className="text-sm font-medium">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </label>

        <label className="block mb-2 mt-4">
          <span className="text-sm font-medium">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </label>

        <label className="block mb-2 mt-4">
          <span className="text-sm font-medium">New Password (optional)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {message && (
          <p className="mt-4 text-sm text-green-600">{message}</p>
        )}
      </div>
    </main>
  )
}
