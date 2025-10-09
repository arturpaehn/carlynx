'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserType } from '@/hooks/useUserType'

interface DealerGuardProps {
  children: React.ReactNode
  fallbackUrl?: string
}

/**
 * Guard component that only allows dealers to access the wrapped content
 * Redirects individual users to home page
 */
export default function DealerGuard({ children, fallbackUrl = '/' }: DealerGuardProps) {
  const router = useRouter()
  const { userType, loading } = useUserType()

  useEffect(() => {
    if (!loading && userType !== 'dealer') {
      console.warn('Access denied: User is not a dealer, redirecting to', fallbackUrl)
      router.push(fallbackUrl)
    }
  }, [userType, loading, router, fallbackUrl])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not a dealer, show nothing (redirect will happen)
  if (userType !== 'dealer') {
    return null
  }

  // Dealer confirmed, render children
  return <>{children}</>
}
