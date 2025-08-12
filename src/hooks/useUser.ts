"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User as SupabaseUser } from '@supabase/supabase-js'

export interface UserProfile {
  user_id: string;
  email: string;
  is_blocked: boolean;
  name?: string;
  phone?: string;
  dealer_attempts_count?: number;
  abuse_attempts_count?: number;
}

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
        let profileData;
        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id, email, is_blocked, name, phone, dealer_attempts_count, abuse_attempts_count')
          .eq('user_id', user.id)
          .single();
        profileData = data;
        if (!profileData && !profileError) {
          // Если recovery flow (type=recovery в URL), не держим loading
          if (typeof window !== 'undefined' && window.location.search.includes('type=recovery')) {
            setProfile(null);
            setBlocked(false);
            setLoading(false);
            return;
          }
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              name: user.user_metadata?.name || '',
              phone: user.user_metadata?.phone || '',
              dealer_attempts_count: 0,
              abuse_attempts_count: 0,
              is_blocked: false,
            })
            .select()
            .single();
          profileData = newProfile;
        }
        setProfile(profileData)
        setBlocked(!!profileData?.is_blocked)
        setLoading(false)
      } else {
        setProfile(null)
        setBlocked(false)
        setLoading(false)
      }
    }
    getSessionAndProfile()
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, authSession) => {
        const user = authSession?.user as SupabaseUser | undefined
        if (user) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_id, email, is_blocked, name, phone, dealer_attempts_count, abuse_attempts_count')
            .eq('user_id', user.id)
            .single();
          setProfile(profileData)
          setBlocked(!!profileData?.is_blocked)
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
  if (loading) return { loading, blocked, profile };
  if (profile) return { ...profile, blocked, loading };
  return { loading, blocked, profile };
}
