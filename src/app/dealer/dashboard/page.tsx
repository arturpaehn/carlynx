'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import DealerGuard from '@/components/dealer/DealerGuard'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/components/I18nProvider'

interface SubscriptionInfo {
  subscription_status: string
  trial_end_date: string | null
  current_tier_id: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
}

interface TierInfo {
  tier_name: string
  monthly_price: number
  max_active_listings: number | null
}

interface MostViewedListing {
  id: string
  title: string
  model: string
  year: number
  price: number
  views: number
}

interface RecentListing {
  id: string
  title: string
  model: string
  year: number
  price: number
  created_at: string
  image_url?: string
}

export default function DealerDashboardPage() {
  const { t } = useTranslation()
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null)
  const [activeListingsCount, setActiveListingsCount] = useState(0)
  const [inactiveListingsCount, setInactiveListingsCount] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [mostViewedListing, setMostViewedListing] = useState<MostViewedListing | null>(null)
  const [recentListings, setRecentListings] = useState<RecentListing[]>([])
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Fetch dealer subscription info
        const { data: dealerData } = await supabase
          .from('dealers')
          .select('subscription_status, trial_end_date, current_tier_id, subscription_start_date, subscription_end_date, verified')
          .eq('user_id', session.user.id)
          .single()

        if (dealerData) {
          setSubscriptionInfo(dealerData)
          setIsVerified(dealerData.verified || false)

          // Fetch tier info if dealer has a tier
          if (dealerData.current_tier_id) {
            const { data: tierData } = await supabase
              .from('subscription_tiers')
              .select('tier_name, monthly_price, max_active_listings')
              .eq('tier_id', dealerData.current_tier_id)
              .single()

            if (tierData) setTierInfo(tierData)
          }
        }

        // Count active listings
        const { count: activeCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('is_active', true)

        setActiveListingsCount(activeCount || 0)

        // Count inactive listings
        const { count: inactiveCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('is_active', false)

        setInactiveListingsCount(inactiveCount || 0)

        // Get total views across all listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('views, id, title, model, year, price')
          .eq('user_id', session.user.id)

        if (listingsData && listingsData.length > 0) {
          const total = listingsData.reduce((sum, listing) => sum + (listing.views || 0), 0)
          setTotalViews(total)

          // Find most viewed listing
          const mostViewed = listingsData.reduce((max, listing) => 
            (listing.views || 0) > (max?.views || 0) ? listing : max
          )
          
          if (mostViewed && mostViewed.views > 0) {
            setMostViewedListing(mostViewed as MostViewedListing)
          }
        }

        // Get recent listings (last 5)
        const { data: recentData } = await supabase
          .from('listings')
          .select('id, title, model, year, price, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentData && recentData.length > 0) {
          // Load first image for each listing
          const listingsWithImages = await Promise.all(
            recentData.map(async (listing) => {
              const { data: imageData } = await supabase
                .from('listing_images')
                .select('image_url')
                .eq('listing_id', listing.id)
                .limit(1)
                .single()
              
              return {
                ...listing,
                image_url: imageData?.image_url || null
              }
            })
          )
          
          setRecentListings(listingsWithImages as RecentListing[])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
      
      console.log('📊 Dashboard data loaded:', {
        loading,
        subscriptionInfo,
        tierInfo,
        activeListingsCount
      })
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getDaysRemaining = () => {
    if (!subscriptionInfo?.trial_end_date) return null
    const trialEnd = new Date(subscriptionInfo.trial_end_date)
    const today = new Date()
    const diffTime = trialEnd.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const translateTierName = (tierId: string) => {
    const tierMap: Record<string, string> = {
      'tier_100': t('tier100'),
      'tier_250': t('tier250'),
      'tier_500': t('tier500'),
      'tier_1000': t('tier1000'),
      'tier_unlimited': t('tierUnlimited')
    }
    return tierMap[tierId] || tierId
  }

  return (
    <DealerGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dealerDashboard')}</h1>
            <p className="text-gray-600">{t('welcomeToDealerPanel')}</p>
          </div>

          {/* Subscription Status Card */}
          {!loading && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">📊 {t('subscriptionStatus')}</h2>
                <a 
                  href="/dealer/subscription" 
                  className="text-purple-600 hover:text-purple-700 font-semibold text-sm hover:underline"
                >
                  {t('chooseYourPlan')} →
                </a>
              </div>

              {/* If no subscription info */}
              {!subscriptionInfo && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Subscription Yet</h3>
                  <p className="text-gray-600 mb-4">Start with a 7-day free trial - no credit card required!</p>
                  <a 
                    href="/dealer/subscription" 
                    className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    {t('chooseYourPlan')}
                  </a>
                </div>
              )}

              {/* If subscription exists */}
              {subscriptionInfo && (

              <div className="grid md:grid-cols-3 gap-6">
                {/* Current Plan */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl">
                  <div className="text-sm text-purple-600 font-semibold mb-1">{t('currentPlan')}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {subscriptionInfo.subscription_status === 'trialing'
                      ? t('trialPlan')
                      : subscriptionInfo.current_tier_id && tierInfo
                      ? translateTierName(subscriptionInfo.current_tier_id)
                      : t('noSubscription')}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {subscriptionInfo.subscription_status === 'trialing'
                      ? t('freeForSevenDays')
                      : tierInfo
                      ? `$${tierInfo.monthly_price}/${t('month')}`
                      : '-'}
                  </div>
                </div>

                {/* Status & Days Remaining */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                  <div className="text-sm text-green-600 font-semibold mb-1">{t('currentStatus')}</div>
                  <div className="text-2xl font-bold text-gray-900 capitalize">
                    {subscriptionInfo.subscription_status === 'trialing' ? t('trialing') : 
                     subscriptionInfo.subscription_status === 'active' ? t('active') : 
                     subscriptionInfo.subscription_status === 'canceled' ? t('canceled') : 
                     subscriptionInfo.subscription_status}
                  </div>
                  {subscriptionInfo.subscription_status === 'trialing' && getDaysRemaining() !== null && (
                    <div className="text-sm text-gray-600 mt-1">
                      {getDaysRemaining()} {t('daysRemaining')}
                    </div>
                  )}
                </div>

                {/* Listings Usage */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl">
                  <div className="text-sm text-orange-600 font-semibold mb-1">{t('activeListings')}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {activeListingsCount} / {
                      subscriptionInfo.subscription_status === 'trialing'
                        ? '∞'
                        : subscriptionInfo.current_tier_id && tierInfo && tierInfo.max_active_listings !== null
                        ? tierInfo.max_active_listings
                        : t('unlimited')
                    }
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {subscriptionInfo.subscription_status === 'trialing' ? t('unlimitedDuringTrial') : t('activeListingsLimit')}
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* Performance Stats */}
          {!loading && subscriptionInfo && (
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Total Views */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{t('totalViews')}</h3>
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {totalViews.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">{t('totalViewsDesc')}</p>
              </div>

              {/* Next Billing Date */}
              {subscriptionInfo.subscription_status !== 'trialing' && subscriptionInfo.subscription_end_date && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{t('nextBilling')}</h3>
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {new Date(subscriptionInfo.subscription_end_date).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-gray-600">{t('nextBillingDesc')}</p>
                </div>
              )}

              {/* Most Viewed Listing */}
              {mostViewedListing && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{t('mostPopular')}</h3>
                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                    </svg>
                  </div>
                  <a href={`/listing/${mostViewedListing.id}`} className="block hover:opacity-80 transition-opacity">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {mostViewedListing.year} {mostViewedListing.title} {mostViewedListing.model}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{mostViewedListing.views} {t('views')}</span>
                      <span className="text-sm font-semibold text-green-600">${mostViewedListing.price.toLocaleString()}</span>
                    </div>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <a 
              href="/dealer/add-listing" 
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white hover:scale-105 transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">+ {t('addNewListing')}</h3>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-green-100">{t('addNewListingDesc')}</p>
            </a>

            <a 
              href="/dealer/my-listings" 
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white hover:scale-105 transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{t('myListings')}</h3>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="text-blue-100">{t('myListingsDesc')}</p>
            </a>

            <a 
              href="/dealer/subscription" 
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white hover:scale-105 transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{t('subscription')}</h3>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <p className="text-purple-100">{t('manageSubscriptionDesc')}</p>
            </a>
          </div>

          {/* Additional Stats & Info */}
          {!loading && (
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {/* Inactive Listings Alert */}
              {inactiveListingsCount > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900">{t('inactiveListings')}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">
                    {t('youHave')} <span className="font-bold text-yellow-600">{inactiveListingsCount}</span> {t('inactiveListingsNote')}
                  </p>
                  <a 
                    href="/dealer/my-listings" 
                    className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    {t('reactivateNow')} →
                  </a>
                </div>
              )}

              {/* Verification Status */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-4">
                  {isVerified ? (
                    <>
                      <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                      <h3 className="text-lg font-bold text-green-600">{t('verifiedDealer')}</h3>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <h3 className="text-lg font-bold text-gray-600">{t('notVerified')}</h3>
                    </>
                  )}
                </div>
                <p className="text-gray-600 mb-3">
                  {isVerified 
                    ? t('verifiedDealerDesc')
                    : t('notVerifiedDesc')}
                </p>
                {!isVerified && (
                  <a 
                    href="/dealer/profile" 
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    {t('getVerified')} →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Recent Listings */}
          {!loading && recentListings.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 {t('recentListings')}</h2>
              <div className="grid md:grid-cols-5 gap-4">
                {recentListings.map((listing) => (
                  <a 
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="block bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {listing.image_url ? (
                      <div className="w-full h-32 relative">
                        <Image 
                          src={listing.image_url} 
                          alt={`${listing.year} ${listing.title} ${listing.model}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-3">
                      <div className="font-bold text-sm text-gray-900 mb-1 truncate">
                        {listing.year} {listing.title}
                      </div>
                      <div className="text-xs text-gray-600 truncate mb-1">{listing.model}</div>
                      <div className="text-sm font-bold text-green-600">${listing.price.toLocaleString()}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DealerGuard>
  )
}
