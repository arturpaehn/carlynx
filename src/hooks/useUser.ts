'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  user_id: string;
  email: string;
  is_blocked: boolean;
}
import { supabase } from '@/lib/supabaseClient'
import { User as SupabaseUser } from '@supabase/supabase-js'

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();

  useEffect(() => {
    const getSessionAndProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        const user = data.session?.user as SupabaseUser | undefined
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id, email, is_blocked')
            .eq('user_id', user.id)
            .single()
          if (profileError) throw profileError
          setProfile(profileData)
        } else {
          setProfile(null)
        }
      } catch (error: unknown) {
        console.error('Session fetch error:', error)
        setProfile(null)
        setError('Session error. Logging out...')
        await supabase.auth.signOut()
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getSessionAndProfile()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, authSession) => {
        try {
          const user = authSession?.user as SupabaseUser | undefined
          if (user) {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('user_id, email, is_blocked')
              .eq('user_id', user.id)
              .single()
            if (profileError) throw profileError
            setProfile(profileData)
          } else {
            setProfile(null)
          }
        } catch (error: unknown) {
          console.error('Auth state change error:', error)
          setProfile(null)
          setError('Session error. Logging out...')
          await supabase.auth.signOut()
          router.push('/login')
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  if (loading) return { loading: true }
  if (error) return { error }
  return profile ? profile : null
}
