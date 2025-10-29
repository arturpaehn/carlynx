'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import DealerGuard from '@/components/dealer/DealerGuard'
import { useTranslation } from '@/components/I18nProvider'

interface SubscriptionTier {
  tier_id: string
  tier_name: string
  monthly_price: number
  listing_limit: number | null
  active: boolean
}

interface DealerSubscription {
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled' | 'inactive'
  trial_end_date: string | null
  current_tier_id: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  cancel_at_period_end: boolean | null
  cancellation_scheduled_for: string | null
}

export default function DealerSubscriptionPage() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { t, currentLanguage } = useTranslation()
  
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<DealerSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch for date formatting
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Helper to format dates safely
  const formatDate = (dateString: string | null) => {
    if (!dateString || !mounted) return ''
    return new Date(dateString).toLocaleDateString()
  }
  
  // Helper to translate subscription status
  const translateStatus = (status: string) => {
    const statusMap: Record<string, 'trial' | 'active' | 'pastDue' | 'canceled'> = {
      'trial': 'trial',
      'active': 'active',
      'past_due': 'pastDue',
      'canceled': 'canceled'
    }
    return statusMap[status] ? t(statusMap[status]) : status
  }

  // Helper to translate tier names
  const translateTierName = (tierName: string) => {
    console.log('🔍 translateTierName called with:', tierName)
    console.log('🌐 Current language:', currentLanguage)
    // Map tier names to translation keys
    const tierMap: Record<string, 'tier100' | 'tier250' | 'tier500' | 'tier1000' | 'tierUnlimited'> = {
      'tier_100': 'tier100',
      'tier_250': 'tier250',
      'tier_500': 'tier500',
      'tier_1000': 'tier1000',
      'tier_unlimited': 'tierUnlimited'
    }
    const translationKey = tierMap[tierName]
    
    // Direct test
    console.log('🧪 Direct test t("tier100"):', t('tier100'))
    console.log('🧪 Direct test t("tierUnlimited"):', t('tierUnlimited'))
    
    const result = translationKey ? t(translationKey) : tierName
    console.log('🔑 Translation key:', translationKey, '📝 Result:', result)
    return result
  }

  // Fetch subscription tiers and current subscription
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }

        // Fetch subscription tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('active', true)
          .order('monthly_price', { ascending: true })

        if (tiersError) throw tiersError
        console.log('Tiers from database:', tiersData)
        setTiers(tiersData || [])

        // Fetch current dealer subscription
        const { data: dealerData, error: dealerError } = await supabase
          .from('dealers')
          .select('subscription_status, trial_end_date, current_tier_id, subscription_start_date, subscription_end_date, cancel_at_period_end, cancellation_scheduled_for')
          .eq('user_id', session.user.id)
          .single()

        if (dealerError && dealerError.code !== 'PGRST116') {
          // PGRST116 = not found, which is ok for new dealers
          throw dealerError
        }

        setCurrentSubscription(dealerData)
      } catch (err) {
        console.error('Error fetching subscription data:', err)
        setError('Failed to load subscription information')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleSubscribe = async (tierId: string) => {
    try {
      setSubscribing(tierId)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      console.log('🚀 Starting subscription process for tier:', tierId)

      // Call API to create Stripe Checkout session
      const response = await fetch('/api/dealer/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          tierId: tierId
        })
      })

      const data = await response.json()
      console.log('📦 API Response:', data)
      console.log('✅ Response OK:', response.ok)
      console.log('🔗 URL received:', data.url)
      console.log('🔍 URL type:', typeof data.url)

      if (!response.ok) {
        console.error('❌ API Error:', data.error)
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Validate and redirect to Stripe Checkout
      if (!data.url) {
        console.error('❌ No URL in response:', data)
        throw new Error('No checkout URL received from server')
      }

      // Check if URL is valid
      if (typeof data.url !== 'string' || data.url.trim() === '') {
        console.error('❌ Invalid URL format:', data.url)
        throw new Error('Invalid checkout URL format')
      }

      // Ensure URL has proper scheme
      if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
        console.error('❌ URL missing scheme:', data.url)
        throw new Error('Checkout URL is missing https:// scheme')
      }

      console.log('✅ Redirecting to valid URL:', data.url)
      window.location.href = data.url
    } catch (err) {
      console.error('💥 Error subscribing:', err)
      setError(err instanceof Error ? err.message : 'Failed to start subscription')
      setSubscribing(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
      return
    }

    try {
      setCanceling(true)
      setError(null)
      setSuccessMessage(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/dealer/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSuccessMessage(data.message)
      
      // Refresh subscription data
      const { data: updatedDealer } = await supabase
        .from('dealers')
        .select('subscription_status, trial_end_date, current_tier_id, subscription_start_date, subscription_end_date, cancel_at_period_end, cancellation_scheduled_for')
        .eq('user_id', session.user.id)
        .single()
      
      setCurrentSubscription(updatedDealer)
    } catch (err) {
      console.error('Error canceling subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setCanceling(false)
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      setReactivating(true)
      setError(null)
      setSuccessMessage(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/dealer/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      setSuccessMessage(data.message)
      
      // Refresh subscription data
      const { data: updatedDealer } = await supabase
        .from('dealers')
        .select('subscription_status, trial_end_date, current_tier_id, subscription_start_date, subscription_end_date, cancel_at_period_end, cancellation_scheduled_for')
        .eq('user_id', session.user.id)
        .single()
      
      setCurrentSubscription(updatedDealer)
    } catch (err) {
      console.error('Error reactivating subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription')
    } finally {
      setReactivating(false)
    }
  }

  if (loading) {
    return (
      <DealerGuard>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center pt-32">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading subscription plans...</p>
          </div>
        </div>
      </DealerGuard>
    )
  }

  const getTierColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
      'from-green-500 to-green-600'
    ]
    return colors[index % colors.length]
  }

  return (
    <DealerGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-32 pb-16 px-4">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-10 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 -right-10 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t('chooseYourPlan')}</h1>
            <p className="text-xl text-gray-600">{t('startWithFreeTrial')}</p>
            
            {/* Current Subscription Status */}
            {currentSubscription && currentSubscription.subscription_status !== 'inactive' && (
              <div className="mt-6 inline-block px-6 py-3 bg-white rounded-lg shadow-md">
                <p className="text-sm text-gray-600">
                  {t('currentStatus')}: <span className="font-semibold text-green-600 capitalize">{translateStatus(currentSubscription.subscription_status)}</span>
                  {currentSubscription.trial_end_date && currentSubscription.subscription_status === 'trial' && mounted && (
                    <span className="ml-2 text-gray-500">
                      ({t('trialEnds')}: {formatDate(currentSubscription.trial_end_date)})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Cancellation Warning */}
          {currentSubscription?.cancel_at_period_end && currentSubscription.cancellation_scheduled_for && (
            <div className="mb-8 max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">{t('subscriptionCancellationScheduled')}</h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    {t('subscriptionWillBeCanceledOn')}{' '}
                    <span className="font-semibold">
                      {formatDate(currentSubscription.cancellation_scheduled_for)}
                    </span>
                    . {t('continueAccessUntil')}
                  </p>
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={reactivating}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {reactivating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('reactivating')}
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {t('reactivateSubscription')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 max-w-2xl mx-auto bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 max-w-2xl mx-auto bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            {tiers.map((tier, index) => {
              const isCurrentTier = currentSubscription?.current_tier_id === tier.tier_id
              const isSubscribing = subscribing === tier.tier_id
              
              return (
                <div 
                  key={tier.tier_id} 
                  className={`bg-white rounded-2xl shadow-xl p-6 border-2 transition-all duration-300 hover:scale-105 ${
                    isCurrentTier ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100 hover:border-green-300'
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                      {t('currentPlan')}
                    </div>
                  )}
                  
                  <div className={`bg-gradient-to-r ${getTierColor(index)} text-white text-center py-3 rounded-lg mb-4`}>
                    <h3 className="text-lg font-bold">{translateTierName(tier.tier_id)}</h3>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-gray-900">${tier.monthly_price}</div>
                    <div className="text-sm text-gray-500">/{t('month')}</div>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="text-2xl font-semibold text-green-600">
                      {tier.listing_limit === null ? t('unlimited') : tier.listing_limit}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleSubscribe(tier.tier_id)}
                    disabled={isCurrentTier || isSubscribing}
                    className={`w-full py-3 rounded-lg font-semibold shadow-md transition-all duration-300 ${
                      isCurrentTier 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {isSubscribing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('processing')}
                      </span>
                    ) : isCurrentTier ? (
                      t('currentPlan')
                    ) : (
                      t('selectPlan')
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('allPlansInclude')}</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{t('sevenDayFreeTrial')}</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{t('bulkListingCreation')}</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{t('csvExcelImport')}</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{t('listingReactivation')}</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{t('advancedFiltering')}</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{t('cancelAnytime')}</span>
              </li>
            </ul>
          </div>

          {/* Cancel Subscription Section */}
          {currentSubscription && 
           (currentSubscription.subscription_status === 'active' || currentSubscription.subscription_status === 'trial') && 
           !currentSubscription.cancel_at_period_end && (
            <div className="mt-12 text-center">
              <div className="inline-block bg-white rounded-xl shadow-lg p-6 max-w-2xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('needToCancel')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('cancelAnytimeDescription')}
                </p>
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="inline-flex items-center px-6 py-3 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {canceling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('canceling')}
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('cancelSubscription')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DealerGuard>
  )
}
