'use client'

import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image';
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getCacheBuster } from '@/lib/cacheUtils'
import { useTranslation } from '@/components/I18nProvider'

// SEO функция для поиска
function updateSearchSEO(searchParams: URLSearchParams | null) {
  if (typeof window === 'undefined') return;

  const vehicleType = searchParams?.get('vehicle_type') || '';
  const city = searchParams?.get('city') || '';
  const state = searchParams?.get('state') || '';
  const brand = searchParams?.get('brand') || '';
  const motorcycleBrand = searchParams?.get('motorcycleBrand') || '';
  
  // Создаем динамический title
  let title = 'Search Results';
  const titleParts = [];
  
  if (vehicleType === 'car') titleParts.push('Cars');
  else if (vehicleType === 'motorcycle') titleParts.push('Motorcycles');
  else titleParts.push('Vehicles');
  
  if (brand) titleParts.push(brand);
  if (motorcycleBrand) titleParts.push(motorcycleBrand);
  if (city) titleParts.push(`in ${city}`);
  if (state) titleParts.push(`${city ? ', ' : 'in '}${state}`);
  
  if (titleParts.length > 0) {
    title = `${titleParts.join(' ')} for Sale | CarLynx`;
  } else {
    title = 'Search Results - Find Your Perfect Vehicle | CarLynx';
  }

  // Создаем description
  let description = `Find ${titleParts.length > 0 ? titleParts.join(' ').toLowerCase() : 'used cars and motorcycles'} for sale`;
  if (city || state) {
    description += ` in ${city}${state && city ? ', ' : ''}${state}`;
  }
  description += '. Browse verified listings, compare prices, and connect with sellers on CarLynx.';

  document.title = title;
  
  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  // Update canonical URL
  const canonicalUrl = `https://carlynx.us/search-results${searchParams ? '?' + searchParams.toString() : ''}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);
}

type Listing = {
  id: number | string
  title: string
  price: number
  year: number
  transmission: string | null
  fuel_type: string
  model: string | null
  image_url: string | null
  vehicle_type: 'car' | 'motorcycle' | null
  engine_size: number | null
  state?: {
    name: string
    code: string
    country_code: string
  } | null
  city?: string | null
  is_external?: boolean
  external_source?: string
  external_url?: string
}


const RESULTS_PER_PAGE = 15


export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center relative">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchResultsPageContent />
    </Suspense>
  );
}

function SearchResultsPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const currentSort = searchParams?.get('sort_by') || '';
  // Для фильтра по городу (без автодополнения)
  const [cityInput, setCityInput] = useState(searchParams?.get('city') || '');

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      setError('')

      // Add cache busting for search results
      const cacheBuster = getCacheBuster();
      console.log('Fetching search results with cache buster:', cacheBuster);

      const filters: Record<string, string> = {};
      if (searchParams) {
        for (const [key, value] of searchParams.entries()) {
          filters[key] = value;
        }
      }

      let sortField = 'id'
      let sortOrder: 'asc' | 'desc' = 'desc'

      if (currentSort === 'price-asc') {
        sortField = 'price'
        sortOrder = 'asc'
      } else if (currentSort === 'price-desc') {
        sortField = 'price'
        sortOrder = 'desc'
      } else if (currentSort === 'year-asc') {
        sortField = 'year'
        sortOrder = 'asc'
      } else if (currentSort === 'year-desc') {
        sortField = 'year'
        sortOrder = 'desc'
      }

      let query = supabase
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
          vehicle_type,
          engine_size,
          states (id, name, code, country_code),
          cities (id, name),
          transmission,
          fuel_type,
          listing_images (image_url)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order(sortField, { ascending: sortOrder === 'asc' })

      // Фильтры
      if (filters.vehicle_type) query = query.eq('vehicle_type', filters.vehicle_type)
      if (filters.brand) query = query.eq('title', filters.brand)
      if (filters.city_id) {
        query = query.eq('city_id', Number(filters.city_id));
      } else if (filters.city) {
        query = query.ilike('city_name', `%${filters.city}%`)
      }
      if (filters.year_min) query = query.gte('year', Number(filters.year_min))
      if (filters.year_max) query = query.lte('year', Number(filters.year_max))
      if (filters.transmission && filters.vehicle_type !== 'motorcycle') query = query.eq('transmission', filters.transmission)
      if (filters.fuel_type) query = query.eq('fuel_type', filters.fuel_type)
      if (filters.price_min) query = query.gte('price', Number(filters.price_min))
      if (filters.price_max) query = query.lte('price', Number(filters.price_max))

      // Engine size фильтры
      if (filters.engine_size_min) {
        let minCC = Number(filters.engine_size_min);
        // Если это автомобиль и значение меньше 100, предполагаем, что это литры
        if (filters.vehicle_type === 'car' && minCC < 100) {
          minCC = minCC * 1000; // Конвертируем литры в cc
        }
        query = query.gte('engine_size', minCC);
      }
      if (filters.engine_size_max) {
        let maxCC = Number(filters.engine_size_max);
        // Если это автомобиль и значение меньше 100, предполагаем, что это литры
        if (filters.vehicle_type === 'car' && maxCC < 100) {
          maxCC = maxCC * 1000; // Конвертируем литры в cc
        }
        query = query.lte('engine_size', maxCC);
      }

      // Фильтрация по штатам: если выбраны — только выбранные, если нет — все
      const stateIds = searchParams ? searchParams.getAll('state_id').map(Number).filter(Boolean) : [];
      if (stateIds.length > 0) {
        query = query.in('state_id', stateIds);
      }

      const from = (page - 1) * RESULTS_PER_PAGE
      const to = from + RESULTS_PER_PAGE - 1

      const { data: listingsData, error: listingsError } = await query

      if (listingsError) {
        setError('Failed to load listings.')
        setLoading(false)
        return;
      }

      // Fetch external listings with same filters
      let externalQuery = supabase
        .from('external_listings')
        .select(`
          id,
          title,
          model,
          year,
          price,
          state_id,
          city_id,
          city_name,
          vehicle_type,
          transmission,
          fuel_type,
          image_url,
          source,
          external_url,
          views,
          states (id, name, code, country_code)
        `)
        .eq('is_active', true)

      // Apply same filters as regular listings
      if (filters.vehicle_type) externalQuery = externalQuery.eq('vehicle_type', filters.vehicle_type)
      if (filters.city_id) {
        externalQuery = externalQuery.eq('city_id', Number(filters.city_id));
      } else if (filters.city) {
        externalQuery = externalQuery.ilike('city_name', `%${filters.city}%`)
      }
      if (filters.year_min) externalQuery = externalQuery.gte('year', Number(filters.year_min))
      if (filters.year_max) externalQuery = externalQuery.lte('year', Number(filters.year_max))
      if (filters.transmission && filters.vehicle_type !== 'motorcycle') externalQuery = externalQuery.eq('transmission', filters.transmission)
      if (filters.fuel_type) externalQuery = externalQuery.eq('fuel_type', filters.fuel_type)
      if (filters.price_min) externalQuery = externalQuery.gte('price', Number(filters.price_min))
      if (filters.price_max) externalQuery = externalQuery.lte('price', Number(filters.price_max))

      // Simple brand filter for external listings - search in title field
      if (filters.brand) {
        externalQuery = externalQuery.ilike('title', `%${filters.brand}%`)
      }

      if (stateIds.length > 0) {
        externalQuery = externalQuery.in('state_id', stateIds);
      }

      const { data: externalData, error: externalError } = await externalQuery

      if (externalError) {
        console.error('Error fetching external listings:', externalError);
      }

      // Format regular listings
      const formatted: Listing[] = Array.isArray(listingsData)
        ? listingsData.map((item) => {
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
            // Логика как на главной: если есть city_name — берём его, иначе — название из cities
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
              transmission: item.transmission,
              fuel_type: item.fuel_type,
              vehicle_type: item.vehicle_type,
              engine_size: item.engine_size,
              image_url: Array.isArray(item.listing_images) && item.listing_images[0]?.image_url
                ? item.listing_images[0].image_url
                : null,
            }
          })
        : []

      // Format external listings
      const formattedExternal: Listing[] = Array.isArray(externalData)
        ? externalData.map((item) => {
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
            
            return {
              id: `ext-${item.id}`,
              title: item.title,
              model: item.model ?? '',
              year: item.year ?? undefined,
              price: item.price,
              state: stateObj,
              city: item.city_name,
              transmission: item.transmission,
              fuel_type: item.fuel_type,
              vehicle_type: item.vehicle_type,
              engine_size: null,
              image_url: item.image_url,
              is_external: true,
              external_source: item.source,
              external_url: item.external_url,
            }
          })
        : []

      // Combine and sort all listings
      const allListings = [...formatted, ...formattedExternal];
      
      // Apply sorting to combined results
      if (sortField === 'price') {
        allListings.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
      } else if (sortField === 'year') {
        allListings.sort((a, b) => sortOrder === 'asc' ? a.year - b.year : b.year - a.year);
      }

      // Paginate combined results
      const paginatedListings = allListings.slice(from, to + 1);

      setListings(paginatedListings)
      setTotalPages(Math.ceil(allListings.length / RESULTS_PER_PAGE))
      setLoading(false)
    }

    fetchListings()
    // Обновляем SEO теги
    updateSearchSEO(searchParams)
  }, [searchParams, page, currentSort])

  // Обработка изменения поля city (обычный input)
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCityInput(e.target.value);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (e.target.value) {
      params.set('city', e.target.value);
    } else {
      params.delete('city');
    }
    router.push(`/search-results?${params.toString()}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (newSort) {
      params.set('sort_by', newSort);
    } else {
      params.delete('sort_by');
    }
    router.push(`/search-results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{t('searchResults')}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('discoverPerfectCar')}
          </p>
        </div>

        {/* Modern Filters Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* City Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <svg className="h-4 w-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('city')}:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cityInput}
                  onChange={handleCityChange}
                  className="w-48 pl-3 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                  placeholder={t('enterCityName')}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <svg className="h-4 w-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                {t('sortBy')}:
              </label>
              <div className="relative">
                <select
                  value={currentSort}
                  onChange={handleSortChange}
                  className="w-52 pl-3 pr-8 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 appearance-none bg-white"
                >
                  <option value="">{t('defaultNewestFirst')}</option>
                  <option value="price-asc">{t('priceLowToHigh')}</option>
                  <option value="price-desc">{t('priceHighToLow')}</option>
                  <option value="year-asc">{t('yearOldToNew')}</option>
                  <option value="year-desc">{t('yearNewToOld')}</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">{t('searchingForCars')}</p>
          </div>
        ) : error ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('searchError')}</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('noResultsFound')}</h3>
            <p className="text-gray-600 mb-6">{t('noResultsDescription')}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t('backToHome')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">{/* Reduced spacing for more compact display */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 font-medium">
                {t('foundResults')} {listings.length} {listings.length !== 1 ? t('results') : t('result')}
                {totalPages > 1 && ` (${t('page')} ${page} ${t('of')} ${totalPages})`}
              </p>
            </div>

            {listings.map((listing) => {
              const params = searchParams ? searchParams.toString() : '';
              const href = `/listing/${listing.id}?from=search&${params}`;
              return (
                <Link
                  key={listing.id}
                  href={href}
                  className="block bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/20 overflow-hidden hover:shadow-lg hover:bg-white/90 transition-all duration-200 transform hover:scale-[1.005]"
                >
                  <div className="flex">
                    {/* Compact Image Section */}
                    <div className="w-24 sm:w-32 flex-shrink-0">
                      {listing.image_url ? (
                        <Image
                          src={listing.image_url}
                          alt={listing.title}
                          width={128}
                          height={96}
                          className="w-full h-20 sm:h-24 object-contain bg-gray-50"
                        />
                      ) : (
                        <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Compact Content Section */}
                    <div className="flex-1 p-3 sm:p-4 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-sm sm:text-base font-bold text-gray-800 truncate">{listing.title}</h2>
                            {listing.is_external && listing.external_source === 'mars_dealership' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 flex-shrink-0">
                                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Partner
                              </span>
                            )}
                          </div>
                          {listing.model && (
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{listing.model}</p>
                          )}
                        </div>
                        {listing.price && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-base sm:text-lg font-bold text-green-600">${listing.price.toLocaleString()}</div>
                          </div>
                        )}
                      </div>

                      {/* Compact Details - Single Row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        {listing.vehicle_type && (
                          <div className="flex items-center">
                            <span className="font-medium text-orange-600">
                              {listing.vehicle_type === 'motorcycle' ? '🏍️' : '🚗'}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <svg className="h-3 w-3 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{listing.year}</span>
                        </div>

                        {listing.transmission && listing.vehicle_type !== 'motorcycle' && (
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="capitalize">{listing.transmission}</span>
                          </div>
                        )}

                        <div className="flex items-center">
                          <svg className="h-3 w-3 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="capitalize">{listing.fuel_type}</span>
                        </div>

                        {listing.engine_size && (
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>
                              {listing.vehicle_type === 'motorcycle' 
                                ? `${listing.engine_size}cc` 
                                : `${(listing.engine_size / 1000).toFixed(1)}L`
                              }
                            </span>
                          </div>
                        )}

                        {(listing.state || listing.city) && (
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate max-w-32">
                              {listing.city && `${listing.city}`}
                              {listing.state && `, ${listing.state.code}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Modern Pagination */}
            {totalPages > 1 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mt-8">
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex gap-1 flex-wrap justify-center">
                    {(() => {
                      const pages = [];
                      const showEllipsis = totalPages > 7;
                      
                      if (!showEllipsis) {
                        // Показываем все страницы, если их меньше 7
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Умная пагинация с "..."
                        // Всегда показываем первую страницу
                        pages.push(1);
                        
                        // Определяем диапазон вокруг текущей страницы
                        let startPage = Math.max(2, page - 1);
                        let endPage = Math.min(totalPages - 1, page + 1);
                        
                        // Расширяем диапазон если мы близко к началу или концу
                        if (page <= 3) {
                          endPage = Math.min(5, totalPages - 1);
                        }
                        if (page >= totalPages - 2) {
                          startPage = Math.max(2, totalPages - 4);
                        }
                        
                        // Добавляем "..." после первой страницы если нужно
                        if (startPage > 2) {
                          pages.push('ellipsis-start');
                        }
                        
                        // Добавляем страницы в диапазоне
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }
                        
                        // Добавляем "..." перед последней страницей если нужно
                        if (endPage < totalPages - 1) {
                          pages.push('ellipsis-end');
                        }
                        
                        // Всегда показываем последнюю страницу
                        if (totalPages > 1) {
                          pages.push(totalPages);
                        }
                      }
                      
                      return pages.map((p) => {
                        if (typeof p === 'string') {
                          // Ellipsis
                          return (
                            <span key={p} className="px-2 py-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              page === p
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      page === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    {t('page')} {page} {t('of')} {totalPages} • {t('showing')} {listings.length} {listings.length !== 1 ? t('results') : t('result')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
