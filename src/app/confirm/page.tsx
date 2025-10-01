'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/components/I18nProvider'

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmPageContent />
    </Suspense>
  )
}

function ConfirmPageContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMessage(t('verifyingEmail'))
    
    const access_token = searchParams?.get('access_token') || '';
    const refresh_token = searchParams?.get('refresh_token') || '';
    if (access_token) {
      supabase.auth
        .setSession({
          access_token,
          refresh_token,
        })
        .then(() => {
          setMessage(t('emailConfirmed') + ' ' + t('redirecting'))
          setTimeout(() => router.push('/'), 1500)
        })
    } else {
      setTimeout(() => setMessage(t('emailConfirmedLogin')), 1500)
    }
  }, [router, searchParams, t])

  return (
    <main className="min-h-screen bg-[#fff2e0] pt-header flex items-center justify-center px-2 sm:px-0">
      <div className="max-w-md mx-auto bg-white shadow p-3 sm:p-6 rounded text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">{t('emailVerified')}</h1>
        <p className="text-gray-700 text-xs sm:text-base">{message}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 sm:mt-6 bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded transition w-full sm:w-auto"
        >
          {t('goToLogin')}
        </button>
      </div>
    </main>
  )
}
