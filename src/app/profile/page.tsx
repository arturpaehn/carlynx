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
  const [profileEmail, setProfileEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession()

      if (error || !sessionData.session?.user) {
        router.push('/login')
        return
      }

      const currentUser = sessionData.session.user
      setUser(currentUser)

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('name, phone, email')
        .eq('user_id', currentUser.id)
        .single()

      if (profileData) {
        setName(profileData.name ?? '')
        setPhone(profileData.phone ?? '')
        setProfileEmail(profileData.email ?? currentUser.email ?? '')
      } else {
        // Если профиль не найден, но пользователь есть — заполняем email
        setProfileEmail(currentUser.email ?? '')
      }

      setLoading(false)
    }

    fetchProfile()
  }, [router, supabase])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    if (!user) {
      setMessage('User not found.')
      setSaving(false)
      return
    }

    // ✅ Обновляем user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        name: name.trim(),
        phone: phone.trim(),
        email: profileEmail.trim(),
      })
      .eq('user_id', user.id)

    if (profileError) {
      setMessage('Error updating profile.')
      setSaving(false)
      return
    }

    // ✅ Обновляем пароль, если указан
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
    <main className="bg-[#fff6ed] min-h-screen px-2 sm:px-4 pt-40 mt-[-40px]">
      <div className="max-w-xl mx-auto p-3 sm:p-6 bg-white rounded shadow">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Your Profile</h1>

        <label className="block mb-2">
          <span className="text-xs sm:text-sm font-medium">Email</span>
          <input
            type="email"
            value={profileEmail}
            onChange={e => setProfileEmail(e.target.value)}
            className="w-full p-2 border rounded text-xs sm:text-base"
          />
        </label>

        <label className="block mb-2 mt-3 sm:mt-4">
          <span className="text-xs sm:text-sm font-medium">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded text-xs sm:text-base"
          />
        </label>

        <label className="block mb-2 mt-3 sm:mt-4">
          <span className="text-xs sm:text-sm font-medium">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded text-xs sm:text-base"
          />
        </label>

        <label className="block mb-2 mt-3 sm:mt-4">
          <span className="text-xs sm:text-sm font-medium">New Password (optional)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded text-xs sm:text-base"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 sm:mt-6 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 w-full sm:w-auto"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {message && (
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-green-600">{message}</p>
        )}
      </div>
    </main>
  )
}
