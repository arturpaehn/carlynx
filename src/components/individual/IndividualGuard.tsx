'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserType } from '@/hooks/useUserType'

interface IndividualGuardProps {
  children: React.ReactNode
  fallbackUrl?: string
}

/**
 * Guard component that only allows individual users to access the wrapped content
 * Redirects dealers to dealer dashboard
 * Redirects non-authenticated users to register page
 */
export default function IndividualGuard({ children, fallbackUrl = '/dealer/dashboard' }: IndividualGuardProps) {
  const router = useRouter()
  const { userType, loading } = useUserType()

  useEffect(() => {
    if (!loading) {
      if (userType === null) {
        // Not authenticated - redirect to register
        console.warn('Access denied: User not authenticated, redirecting to /register')
        router.push('/register')
      } else if (userType === 'dealer') {
        // Dealer - redirect to dealer dashboard
        console.warn('Access denied: User is a dealer, redirecting to', fallbackUrl)
        router.push(fallbackUrl)
      }
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

  // If not authenticated or dealer, show nothing (redirect will happen)
  if (userType === null || userType === 'dealer') {
    return null
  }

  // Individual user - render children
  return <>{children}</>
}
