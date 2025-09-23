
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { monitor, logInfo, logError, logWarn } from '@/lib/monitoring'

// SEO metadata will be handled by layout.tsx for this page






type Listing = {
  id: string
  title: string
  model?: string
  year?: number
  price: number
  state?: {
    name: string
    code: string
    country_code: string
  } | null
  city?: string | null
  image_url?: string
}

export default function Home() {
  logInfo('Home component initialization starting');
  
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  // Инициализируем useUser для аутентификации, но не блокируем загрузку данных
  useUser();

  // Логируем состояние компонента
  logInfo('Home component state initialized', {
    hasListings: listings.length > 0,
    isLoading: loading
  });
  logInfo('home_component_render', {
    loading,
    listingsCount: listings.length,
    timestamp: Date.now()
  });

  useEffect(() => {
    let cancelled = false; // Флаг для предотвращения race conditions
    
    const fetchData = async () => {
      const startTime = Date.now();
      const tracker = monitor.trackSupabaseRequest('homepage_listings', startTime);
      
      logInfo('homepage_data_fetch_start', {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        connectionType: typeof navigator !== 'undefined' ? (navigator as unknown as { connection?: { effectiveType: string } }).connection?.effectiveType : 'unknown',
        timestamp: Date.now()
      });

      logInfo('about_to_call_supabase', { time: Date.now() });

      try {
        const requestStart = Date.now();
        
        logInfo('supabase_request_starting', { 
          startTime: requestStart,
          timestamp: Date.now()
        });
        
        const { data, error } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            model,
            year,
            price,
            state_id,
            city_id,
            city_name,
            states (id, name, code, country_code),
            cities (id, name),
            listing_images (
              image_url
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(12)

        const requestDuration = Date.now() - requestStart;
        
        logInfo('supabase_request_completed', {
          duration: requestDuration,
          hasError: !!error,
          dataReceived: !!data,
          recordCount: data?.length || 0
        });

        // Проверяем, не был ли запрос отменен
        if (cancelled) {
          logWarn('homepage_fetch_cancelled', { reason: 'component_unmounted' });
          return;
        }

        if (error) {
          logError('supabase_fetch_error', {
            code: error.code,
            message: error.message,
            hint: error.hint,
            details: error.details
          });
          tracker.error(error);
          console.error('Failed to fetch listings:', error.code, error.hint);
          setLoading(false);
          return;
        }

      const formatted: Listing[] = Array.isArray(data)
        ? data.map((item) => {
            let stateObj: { name: string; code: string; country_code: string } | null = null;
            if (item.states) {
              if (Array.isArray(item.states) && item.states.length > 0 && typeof item.states[0] === 'object' && 'name' in item.states[0]) {
                stateObj = {
                  name: item.states[0].name,
                  code: item.states[0].code,
                  country_code: item.states[0].country_code,
                };
              } else if (!Array.isArray(item.states) && typeof item.states === 'object' && 'name' in item.states) {
                const s = item.states as { name: string; code: string; country_code: string };
                stateObj = {
                  name: s.name,
                  code: s.code,
                  country_code: s.country_code,
                };
              }
            }
            // Определяем город: если есть city_name (ручной ввод) — берём его, иначе — название из cities
            let city: string | null = null;
            if (item.city_name && item.city_name.trim()) {
              city = item.city_name.trim();
            } else if (item.cities && Array.isArray(item.cities) && item.cities[0]?.name) {
              city = item.cities[0].name;
            } else if (item.cities && typeof item.cities === 'object' && 'name' in item.cities) {
              city = (item.cities as { name: string }).name;
            }
            return {
              id: item.id,
              title: item.title,
              model: item.model ?? '',
              year: item.year ?? undefined,
              price: item.price,
              state: stateObj,
              city,
              image_url: Array.isArray(item.listing_images) && item.listing_images[0]?.image_url
                ? item.listing_images[0].image_url
                : undefined,
            }
          })
        : []

        // Проверяем, не был ли запрос отменен перед обновлением состояния
        if (!cancelled) {
          logInfo('homepage_data_processed', {
            recordsFormatted: formatted.length,
            processingTime: Date.now() - requestStart
          });
          
          tracker.success(formatted);
          setListings(formatted)
          setLoading(false)
          
          logInfo('homepage_render_complete', {
            totalListings: formatted.length,
            totalTime: Date.now() - requestStart
          });
        }
      } catch (error) {
        const errorDetails = {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'UnknownError'
        };
        
        logError('homepage_fetch_exception', errorDetails);
        tracker.error(error);
        
        console.error('Error fetching listings:', error)
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    // Cleanup function для предотвращения race conditions
    return () => {
      cancelled = true;
    }
  }, []) // Убираем зависимость от user - загружаем данные сразу



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
              Welcome to CarLynx
            </h1>
            <p className="max-w-2xl mx-auto text-gray-700 text-base sm:text-lg leading-relaxed">
              Your trusted marketplace for buying and selling cars across Texas and nearby states.
            </p>
          </div>
        </section>

        {/* Latest Cars Section */}
        <section className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Latest Cars
            </h2>
            <div className="max-w-2xl mx-auto text-gray-600 text-lg">
              Discover the newest listings from our community. Find your next ride today!
            </div>
          </div>

          {loading ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin h-8 w-8 text-orange-500 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-700 font-medium">Loading amazing cars...</span>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Cars Yet</h3>
              <p className="text-gray-600">Be the first to list your car on CarLynx!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {listings.map((item) => (
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
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-sm font-bold text-green-600">
                          ${item.price.toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors leading-tight">
                        {item.title}
                        {item.model ? ` ${item.model}` : ''}
                      </h3>

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

                      {!item.image_url && (
                        <div className="text-center py-4 mb-2">
                          <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                            ${item.price.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
