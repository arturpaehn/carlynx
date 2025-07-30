'use client'

import { useEffect, useState } from 'react'

interface UserProfile {
  user_id: string;
  email: string;
  is_blocked: boolean;
}
import { supabase } from '@/lib/supabaseClient'
import { User as SupabaseUser } from '@supabase/supabase-js'

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSessionAndProfile = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user as SupabaseUser | undefined
      if (user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('user_id, email, is_blocked')
          .eq('user_id', user.id)
          .single()
        setProfile(profileData)
        if (profileData?.is_blocked) {
          setBlocked(true)
        } else {
          setBlocked(false)
        }
      } else {
        setProfile(null)
        setBlocked(false)
      }
      setLoading(false)
    }

    getSessionAndProfile()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, authSession) => {
        const user = authSession?.user as SupabaseUser | undefined
        if (user) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_id, email, is_blocked')
            .eq('user_id', user.id)
            .single()
          setProfile(profileData)
          if (profileData?.is_blocked) {
            setBlocked(true)
          } else {
            setBlocked(false)
          }
        } else {
          setProfile(null)
          setBlocked(false)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) return { loading: true }
  if (blocked) return { blocked: true }
  return profile ? { ...profile, blocked: false } : null
}
