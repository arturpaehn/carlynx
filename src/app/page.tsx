
'use client';

import { useEffect, useState } from 'react'
import Image from 'next/image';
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { monitor } from '@/lib/monitoring'
import { useTranslation } from '@/components/I18nProvider'
import PriceBadge from '@/components/PriceBadge'

// SEO metadata will be handled by layout.tsx for this page






type Listing = {
  id: string
  title: string
  model?: string
  year?: number
  price: number
  vin?: string | null
  created_at: string
  state?: {
    name: string
    code: string
    country_code: string
  } | null
  city?: string | null
  image_url?: string
  is_external?: boolean
  external_source?: string
  external_url?: string
  user_type?: string
  brand?: string | null
}

export default function Home() {
  const { t } = useTranslation();
  
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  // Initialize useUser for authentication, but don't block data loading
  useUser();

  useEffect(() => {
    let cancelled = false; // Flag to prevent race conditions
    
    const fetchData = async () => {
      const startTime = Date.now();
      const tracker = monitor.trackSupabaseRequest('homepage_listings', startTime);

      try {
        console.log('Fetching homepage data from API...');
        
        // Fetch from our new API route with ISR
        const response = await fetch('/api/homepage-listings', {
          method: 'GET',
          // Allow browser to cache the response
          cache: 'default',
        });

        // Check if request was cancelled
        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Check if request was cancelled before updating state
        if (!cancelled) {
          tracker.success(data.listings);
          setListings(data.listings || [])
          setLoading(false)
          console.log(`✅ Loaded ${data.listings?.length || 0} listings from API`);
        }
      } catch (error) {
        tracker.error(error);
        console.error('Error fetching listings from API:', error)
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    // Cleanup function to prevent race conditions
    return () => {
      cancelled = true;
    };
  }, []); // Load data immediately on mount



  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 relative overflow-hidden pt-header flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-700 font-medium">Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 relative overflow-hidden pt-header">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <section className="text-center mb-12 sm:mb-16">
          <div className="bg-gradient-to-br from-orange-100/80 via-yellow-50/80 to-orange-200/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-200/30 p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-700 leading-tight py-2">
              {t('welcomeToCarLynx')}
            </h1>
            <p className="max-w-2xl mx-auto text-gray-700 text-base sm:text-lg leading-relaxed">
              {t('marketplaceDescription')}
            </p>
          </div>
        </section>

        {/* Latest Cars Section */}
        <section className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              {t('latestCars')}
            </h2>
            <div className="max-w-2xl mx-auto text-gray-600 text-lg">
              {t('discoverListings')}
            </div>
          </div>

          {loading ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin h-8 w-8 text-orange-500 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-700 font-medium">{t('loadingCars')}</span>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noCarsYet')}</h3>
              <p className="text-gray-600">{t('beTheFirst')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {listings.map((item) => {
                return (
                  <Link key={item.id} href={`/listing/${item.id}`} className="group">
                    <div data-testid="listing-card" className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl hover:bg-white/90 transition-all duration-200 transform hover:scale-[1.02] h-full">
                      {item.image_url && (
                        <div className="relative overflow-hidden">
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            width={280}
                            height={168}
                            className="w-full h-32 sm:h-36 object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-200"
                            placeholder="empty"
                          />
                          {item.price && (
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-sm font-bold text-green-600">
                              ${item.price.toLocaleString()}
                            </div>
                          )}
                          {item.is_external && item.external_source === 'mars_dealership' && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center shadow-lg">
                              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Partner
                            </div>
                          )}
                          {!item.is_external && item.user_type === 'individual' && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center shadow-lg">
                              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Private
                            </div>
                          )}
                          {!item.is_external && item.user_type === 'dealer' && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center shadow-lg">
                              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                              </svg>
                              Dealer
                            </div>
                          )}
                        </div>
                      )}
                    
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors leading-tight">
                        {item.title}
                        {item.model ? ` ${item.model}` : ''}
                      </h3>

                      {/* Price Badge */}
                      {item.brand && item.model && item.year && item.price && (
                        <div className="mb-2">
                          <PriceBadge 
                            brand={item.brand}
                            model={item.model}
                            year={item.year}
                            price={item.price}
                            className="text-xs"
                          />
                        </div>
                      )}

                      {item.year && (
                        <div className="flex items-center text-orange-600 mb-1">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-semibold">{item.year}</span>
                        </div>
                      )}

                      {(item.state || item.city) && (
                        <div className="flex items-center text-gray-600 text-xs">
                          <svg className="h-3 w-3 mr-1 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">
                            {item.city && `${item.city}`}
                            {item.state && `${item.city ? ', ' : ''}${item.state.name}`}
                          </span>
                        </div>
                      )}

                      {!item.image_url && item.price && (
                        <div className="text-center py-4 mb-2">
                          <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                            ${item.price.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
