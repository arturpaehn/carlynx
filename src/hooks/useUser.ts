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
    let cancelled = false; // Флаг для предотвращения race conditions (нужен let для изменения)
    
    const getSessionAndProfile = async () => {
      if (cancelled) return; // Выходим если операция отменена
      
      setLoading(true)
      setError(null)
      try {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (cancelled) return; // Проверяем снова после async операции
        
        if (sessionError) throw sessionError
        const user = data.session?.user as SupabaseUser | undefined
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id, email, is_blocked')
            .eq('user_id', user.id)
            .single()
          if (cancelled) return; // Проверяем перед установкой состояния
          
          if (profileError) throw profileError
          setProfile(profileData)
        } else {
          if (!cancelled) setProfile(null)
        }
      } catch (error: unknown) {
        if (cancelled) return; // Не обрабатываем ошибки отмененных операций
        
        console.error('Session fetch error:', error)
        setProfile(null)
        setError('Session error. Logging out...')
        await supabase.auth.signOut()
        router.push('/login')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    getSessionAndProfile()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, authSession) => {
        if (cancelled) return; // Не обрабатываем изменения для отмененных компонентов
        
        try {
          const user = authSession?.user as SupabaseUser | undefined
          if (user) {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('user_id, email, is_blocked')
              .eq('user_id', user.id)
              .single()
            if (cancelled) return; // Проверяем перед установкой состояния
            
            if (profileError) throw profileError
            setProfile(profileData)
          } else {
            if (!cancelled) setProfile(null)
          }
        } catch (error: unknown) {
          if (cancelled) return; // Не обрабатываем ошибки отмененных операций
          
          console.error('Auth state change error:', error)
          setProfile(null)
          setError('Session error. Logging out...')
          await supabase.auth.signOut()
          router.push('/login')
        }
      }
    )

    return () => {
      cancelled = true; // Отмечаем что компонент размонтирован
      listener.subscription.unsubscribe()
    }
  }, [router])

  if (loading) return { loading: true }
  if (error) return { error }
  return profile ? profile : null
}
