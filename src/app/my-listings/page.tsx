'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/components/I18nProvider'
import IndividualGuard from '@/components/individual/IndividualGuard'

type Listing = {
  id: number
  title: string
  model: string | null
  price: number
  state_id: number | null
  year: number
  transmission: string
  fuel_type: string
  is_active: boolean
  payment_status: string | null
  image_url: string | null
}

type State = {
  id: number
  code: string
  name: string
  country_code: string
}

export default function MyListingsPage() {
  return (
    <IndividualGuard>
      <MyListingsContent />
    </IndividualGuard>
  )
}

function MyListingsContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMyListings = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData?.user

      if (!currentUser) {
        router.push('/login')
        return;
      }

      // Получаем объявления пользователя с state_id
      const { data: userListings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (listingsError || !userListings) {
        setError('Failed to load listings.')
        setLoading(false)
        return;
      }

      const listingIds = userListings.map((l) => l.id)
      const { data: images } = await supabase
        .from('listing_images')
        .select('listing_id, image_url')
        .in('listing_id', listingIds)

      // Получаем все штаты
      const { data: statesData } = await supabase
        .from('states')
        .select('id, code, name, country_code')

      if (statesData) setStates(statesData)

      const listingsWithImages: Listing[] = userListings.map((l) => {
        const image = images?.find((img) => img.listing_id === l.id)
        return {
          ...l,
          image_url: image?.image_url || null,
        } as Listing
      })

      setListings(listingsWithImages)
      setLoading(false)
    }

    fetchMyListings()
  }, [router])

  const handleEdit = (id: number) => {
    router.push(`/edit-listing/${id}`)
  }

  const handleCompletePayment = async (listingId: number, listingTitle: string) => {
    try {
      // Get user data
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData?.user

      if (!currentUser) {
        alert('Please log in to complete payment')
        return
      }

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 500, // $5.00 in cents
          listingTitle: listingTitle,
          userId: currentUser.id,
          userEmail: currentUser.email,
          listingId: listingId.toString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url // Redirect to Stripe Checkout
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error completing payment:', error)
      alert('Failed to start payment. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-2 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Modern Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mr-4">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{t('myListingsTitle')}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('manageYourListings')}
          </p>
        </div>
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">{t('loadingYourListings')}</p>
          </div>
        ) : error ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">{t('errorLoadingListings')}</h3>
            <p className="text-center text-red-600">{error}</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('noListingsYet')}</h3>
            <p className="text-gray-600 mb-6">{t('createFirstListing')}</p>
            <button
              onClick={() => router.push('/add-listing')}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-105"
            >
              {t('createFirstListing')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Listings */}
            <div className="space-y-4">
              {listings.filter((l) => l.is_active).map((listing) => {
                const stateObj = listing.state_id ? states.find(s => s.id === listing.state_id) : null;
                const stateName = stateObj ? stateObj.name : 'N/A';
                let countryLabel = '';
                if (stateObj) {
                  if (stateObj.country_code === 'US') countryLabel = ' (USA)';
                  else if (stateObj.country_code === 'MX') countryLabel = ' (Mexico)';
                }
                return (
                  <div
                    key={listing.id}
                    className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-2 sm:p-4 cursor-pointer border border-white/20"
                    onClick={() => router.push(`/listing/${listing.id}?from=my`)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/listing/${listing.id}?from=my`) }}
                  >
                    <div className="flex gap-2 sm:gap-4">
                      {/* Image Section */}
                      <div className="w-16 sm:w-32 flex-shrink-0">
                        {listing.image_url ? (
                          <div className="relative overflow-hidden rounded-lg">
                            <Image
                              src={listing.image_url}
                              alt="Car listing"
                              width={128}
                              height={96}
                              className="w-full h-12 sm:h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-1 left-1">
                              <span className="bg-green-500 text-white text-xs font-medium px-1 sm:px-2 py-1 rounded-full">
                                {t('active')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-12 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <svg className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-xs text-gray-500 hidden sm:block">No Image</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 sm:mb-3">
                          <h2 className="text-sm sm:text-lg font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors duration-200 truncate">
                            {listing.title}
                          </h2>
                          <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="text-xs">{listing.model || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs">{listing.year}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-xs">{stateName}{countryLabel}</span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile: Stack price and button vertically */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                          <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                            <div className="flex items-center">
                              <svg className="h-4 w-4 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="text-base sm:text-lg font-bold text-orange-600">${listing.price.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-xs">{listing.fuel_type}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="text-xs">{listing.transmission}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(listing.id); }}
                            className="w-full sm:w-auto flex items-center justify-center px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-105"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {t('edit')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Inactive Listings */}
            {listings.some((l) => !l.is_active) && (
              <>
                <div className="text-center py-8">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1 max-w-32"></div>
                    <span className="px-4 text-gray-500 font-medium">{t('inactive')} {t('myListingsTitle')}</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1 max-w-32"></div>
                  </div>
                  <p className="text-sm text-gray-500">{t('inactiveListingsNote')}</p>
                </div>
                
                <div className="space-y-4">
                  {listings.filter((l) => !l.is_active).map((listing) => {
                    const stateObj = listing.state_id ? states.find(s => s.id === listing.state_id) : null;
                    const stateName = stateObj ? stateObj.name : 'N/A';
                    let countryLabel = '';
                    if (stateObj) {
                      if (stateObj.country_code === 'US') countryLabel = ' (USA)';
                      else if (stateObj.country_code === 'MX') countryLabel = ' (Mexico)';
                    }
                    return (
                      <div
                        key={listing.id}
                        className="bg-white/60 backdrop-blur-sm rounded-xl shadow-md p-2 sm:p-4 border border-white/20 opacity-75"
                      >
                        <div className="flex gap-2 sm:gap-4">
                          {/* Image Section */}
                          <div className="w-16 sm:w-32 flex-shrink-0">
                            {listing.image_url ? (
                              <div className="relative overflow-hidden rounded-lg">
                                <Image
                                  src={listing.image_url}
                                  alt="Car listing"
                                  width={128}
                                  height={96}
                                  className="w-full h-12 sm:h-24 object-cover grayscale"
                                />
                                <div className="absolute top-1 left-1">
                                  <span className={`text-white text-xs font-medium px-1 sm:px-2 py-1 rounded-full ${
                                    listing.payment_status === 'pending' 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                  }`}>
                                    {listing.payment_status === 'pending' ? 'Pending' : t('inactive')}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-12 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                  <svg className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-xs text-gray-500 hidden sm:block">No Image</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 sm:mb-3">
                              <h2 className="text-sm sm:text-lg font-bold text-gray-600 mb-1 truncate">
                                {listing.title}
                                <span className={`text-xs sm:text-sm font-medium ml-2 ${
                                  listing.payment_status === 'pending' 
                                    ? 'text-amber-500' 
                                    : 'text-red-500'
                                }`}>
                                  ({listing.payment_status === 'pending' ? 'Pending Payment' : t('inactive')})
                                </span>
                              </h2>
                              <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span className="text-xs">{listing.model || 'N/A'}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs">{listing.year}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="text-xs">{stateName}{countryLabel}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                                <div className="flex items-center">
                                  <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  <span className="text-base sm:text-lg font-bold text-gray-500">${listing.price.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  <span className="text-xs">{listing.fuel_type}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span className="text-xs">{listing.transmission}</span>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {listing.payment_status === 'pending' ? (
                                  <>
                                    <div className="flex items-center text-xs sm:text-sm justify-center sm:justify-start">
                                      <svg className="h-4 w-4 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-amber-600 font-medium">Pending Payment</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleCompletePayment(listing.id, listing.title)
                                      }}
                                      className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                                    >
                                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                      </svg>
                                      Complete Payment ($5)
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-gray-500">Contact admin to reactivate</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
