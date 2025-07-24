'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Listing = {
  id: number
  title: string
  price: number
  location: string
  year: number
  transmission: string
  fuel_type: string
  model: string | null
  image_url: string | null
}

const RESULTS_PER_PAGE = 15

export default function SearchResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const currentSort = searchParams.get('sort_by') || ''

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      setError('')

      const filters: Record<string, string> = {}
      for (const [key, value] of searchParams.entries()) {
        filters[key] = value
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
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortOrder === 'asc' })

      if (filters.brand) query = query.eq('title', filters.brand)
      if (filters.model) query = query.eq('model', filters.model)
      if (filters.location) query = query.ilike('location', `%${filters.location}%`)
      if (filters.year) query = query.eq('year', Number(filters.year))
      if (filters.transmission) query = query.eq('transmission', filters.transmission)
      if (filters.fuel_type) query = query.eq('fuel_type', filters.fuel_type)
      if (filters.price_min) query = query.gte('price', Number(filters.price_min))
      if (filters.price_max) query = query.lte('price', Number(filters.price_max))

      const from = (page - 1) * RESULTS_PER_PAGE
      const to = from + RESULTS_PER_PAGE - 1

      const { data: listingsData, error: listingsError, count } = await query.range(from, to)

      if (listingsError || !listingsData) {
        setError('Failed to load listings.')
        setLoading(false)
        return
      }

      const listingIds = listingsData.map((l) => l.id)
      const { data: images } = await supabase
        .from('listing_images')
        .select('listing_id, image_url')
        .in('listing_id', listingIds)

      const listingsWithImages: Listing[] = listingsData.map((l) => {
        const image = images?.find((img) => img.listing_id === l.id)
        return { ...l, image_url: image?.image_url || null }
      })

      setListings(listingsWithImages)
      setTotalPages(Math.ceil((count || 0) / RESULTS_PER_PAGE))
      setLoading(false)
    }

    fetchListings()
  }, [searchParams, page])

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (newSort) {
      params.set('sort_by', newSort)
    } else {
      params.delete('sort_by')
    }
    router.push(`/search-results?${params.toString()}`)
  }

  const handleCardClick = (id: number) => {
  const params = searchParams.toString()
  router.push(`/listing/${id}?from=search&${params}`)
}



  return (
    <div className="min-h-screen bg-[#fff2e0] pt-[224px] mt-[-224px] px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Search Results</h1>

        {/* Sort selector */}
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
                  <p>Model: {listing.model || 'N/A'}</p>
                  <p>Price: ${listing.price}</p>
                  <p>Year: {listing.year}</p>
                  <p>City: {listing.location}</p>
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
