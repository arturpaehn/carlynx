import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type UserType = 'individual' | 'dealer' | null

interface UseUserTypeReturn {
  userType: UserType
  loading: boolean
  error: string | null
  userId: string | null
  isDealer: boolean
  isIndividual: boolean
}

/**
 * Hook to get the current user's account type from user_profiles
 * Returns: individual, dealer, or null
 */
export function useUserType(): UseUserTypeReturn {
  const [userType, setUserType] = useState<UserType>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current session (doesn't throw error if not logged in)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setUserType(null)
          setUserId(null)
          setLoading(false)
          return
        }

        if (!session?.user) {
          // No active session - user is not logged in
          setUserType(null)
          setUserId(null)
          setLoading(false)
          return
        }

        const user = session.user
        setUserId(user.id)

        // Get user_type from user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          setUserType(null)
          setLoading(false)
          return
        }

        if (!profile) {
          console.warn('User profile not found for user:', user.id)
          setUserType(null)
          setLoading(false)
          return
        }

        setUserType(profile.user_type as UserType)
      } catch (err) {
        console.error('Error in useUserType:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setUserType(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserType()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth state changed:', event)
      fetchUserType()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    userType,
    loading,
    error,
    userId,
    isDealer: userType === 'dealer',
    isIndividual: userType === 'individual',
  }
}
