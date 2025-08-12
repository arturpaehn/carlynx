'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Listing = {
  id: number
  title: string
  price: number
  year: number
  transmission: string
  fuel_type: string
  model: string | null
  image_url: string | null
  state?: {
    name: string
    code: string
    country_code: string
  } | null
  city?: string | null
}


const RESULTS_PER_PAGE = 15


export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResultsPageContent />
    </Suspense>
  );
}

function SearchResultsPageContent() {
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
          states (id, name, code, country_code),
          cities (id, name),
          transmission,
          fuel_type,
          listing_images (image_url)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order(sortField, { ascending: sortOrder === 'asc' })

      if (filters.brand) query = query.eq('title', filters.brand)
      if (filters.city) query = query.ilike('city_name', `%${filters.city}%`)
      if (filters.year_min) query = query.gte('year', Number(filters.year_min))
      if (filters.year_max) query = query.lte('year', Number(filters.year_max))
      if (filters.transmission) query = query.eq('transmission', filters.transmission)
      if (filters.fuel_type) query = query.eq('fuel_type', filters.fuel_type)
      if (filters.price_min) query = query.gte('price', Number(filters.price_min))
      if (filters.price_max) query = query.lte('price', Number(filters.price_max))

      // Фильтрация по штатам: если выбраны — только выбранные, если нет — все
      const stateIds = searchParams ? searchParams.getAll('state_id').map(Number).filter(Boolean) : [];
      if (stateIds.length > 0) {
        query = query.in('state_id', stateIds);
      }

      const from = (page - 1) * RESULTS_PER_PAGE
      const to = from + RESULTS_PER_PAGE - 1

      const { data: listingsData, error: listingsError, count } = await query.range(from, to)

      if (listingsError || !listingsData) {
        setError('Failed to load listings.')
        setLoading(false)
        return
      }

      // Форматируем данные как на главной
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
              image_url: Array.isArray(item.listing_images) && item.listing_images[0]?.image_url
                ? item.listing_images[0].image_url
                : null,
            }
          })
        : []

      setListings(formatted)
      setTotalPages(Math.ceil((count || 0) / RESULTS_PER_PAGE))
      setLoading(false)
    }

    fetchListings()
  }, [searchParams, page])

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

  const handleCardClick = (id: number) => {
    const params = searchParams ? searchParams.toString() : '';
    router.push(`/listing/${id}?from=search&${params}`);
  };

  return (
    <div className="min-h-screen bg-[#fff2e0] pt-48 mt-[-48px] px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Search Results</h1>

        {/* Sort selector */}
        {/* City selector (input) */}
        <div className="flex justify-end mb-4">
          <label className="mr-2 text-base font-semibold text-black">City:</label>
          <input
            type="text"
            value={cityInput}
            onChange={handleCityChange}
            className="border p-2 rounded"
            placeholder="City"
            autoComplete="off"
            style={{ minWidth: 180 }}
          />
        </div>
        <div className="flex justify-end mb-4">
          <label className="mr-2 text-base font-semibold text-black">Sort by:</label>
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="border p-2 rounded"
          >
            <option value="">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="year-asc">Year: Old to New</option>
            <option value="year-desc">Year: New to Old</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : listings.length === 0 ? (
          <p className="text-center">No listings found.</p>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => handleCardClick(listing.id)}
                className="flex items-center bg-white p-4 rounded shadow gap-4 cursor-pointer hover:bg-gray-50 transition"
              >
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt="Listing"
                    className="w-32 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-32 h-24 bg-gray-300 rounded flex items-center justify-center text-sm text-gray-600">
                    No Image
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold">{listing.title}</h2>
                  <p>City: {listing.city || 'N/A'}</p>
                  <p>Price: ${listing.price}</p>
                  <p>Year: {listing.year}</p>
                  {(listing.state || listing.city) && (
                    <p className="text-xs sm:text-sm font-bold text-gray-600">
                      {listing.state ? `${listing.state.name} (${listing.state.country_code === 'US' ? 'USA' : listing.state.country_code === 'MX' ? 'Mexico' : listing.state.country_code})` : ''}
                      {listing.city ? `, ${listing.city}` : ''}
                    </p>
                  )}
                  <p>Transmission: {listing.transmission}</p>
                  <p>Fuel: {listing.fuel_type}</p>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded ${
                      page === p
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
