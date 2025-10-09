'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/components/I18nProvider'
import DealerGuard from '@/components/dealer/DealerGuard'

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
  created_at: string
  image_url: string | null
  vehicle_type: 'car' | 'motorcycle'
}

type State = {
  id: number
  code: string
  name: string
  country_code: string
}

type FilterOptions = {
  status: 'all' | 'active' | 'inactive'
  vehicleType: 'all' | 'car' | 'motorcycle'
  brand: string
  sortBy: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'
}

export default function DealerMyListingsPage() {
  return (
    <DealerGuard>
      <DealerMyListingsContent />
    </DealerGuard>
  )
}

function DealerMyListingsContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [dealerInfo, setDealerInfo] = useState<{
    max_listings: number | null
    active_count: number
    subscription_status: string
  } | null>(null)

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    vehicleType: 'all',
    brand: '',
    sortBy: 'newest'
  })

  useEffect(() => {
    fetchMyListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, filters])

  const fetchMyListings = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user

    if (!currentUser) {
      router.push('/login')
      return
    }

    // Fetch dealer info
    const { data: dealerData } = await supabase
      .from('dealers')
      .select('subscription_status, current_tier_id')
      .eq('user_id', currentUser.id)
      .single()

    if (dealerData) {
      let maxListings: number | null = null
      if (dealerData.current_tier_id) {
        const { data: tierData } = await supabase
          .from('subscription_tiers')
          .select('max_active_listings')
          .eq('tier_id', dealerData.current_tier_id)
          .single()
        if (tierData) {
          maxListings = tierData.max_active_listings
        }
      }

      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('is_active', true)

      setDealerInfo({
        max_listings: maxListings,
        active_count: count || 0,
        subscription_status: dealerData.subscription_status
      })
    }

    // Fetch listings
    const { data: userListings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (listingsError || !userListings) {
      setError('Failed to load listings.')
      setLoading(false)
      return
    }

    const listingIds = userListings.map((l) => l.id)
    const { data: images } = await supabase
      .from('listing_images')
      .select('listing_id, image_url')
      .in('listing_id', listingIds)

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

  const applyFilters = () => {
    let result = [...listings]

    // Status filter
    if (filters.status === 'active') {
      result = result.filter(l => l.is_active)
    } else if (filters.status === 'inactive') {
      result = result.filter(l => !l.is_active)
    }

    // Vehicle type filter
    if (filters.vehicleType !== 'all') {
      result = result.filter(l => l.vehicle_type === filters.vehicleType)
    }

    // Brand filter
    if (filters.brand) {
      result = result.filter(l => 
        l.title.toLowerCase().includes(filters.brand.toLowerCase())
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price_asc':
          return a.price - b.price
        case 'price_desc':
          return b.price - a.price
        case 'name_asc':
          return a.title.localeCompare(b.title)
        case 'name_desc':
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    setFilteredListings(result)
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredListings.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredListings.map(l => l.id))
    }
  }

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return
    
    const { error } = await supabase
      .from('listings')
      .update({ is_active: true })
      .in('id', selectedIds)

    if (!error) {
      await fetchMyListings()
      setSelectedIds([])
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return
    
    const { error } = await supabase
      .from('listings')
      .update({ is_active: false })
      .in('id', selectedIds)

    if (!error) {
      await fetchMyListings()
      setSelectedIds([])
    }
  }

  const handleEdit = (id: number) => {
    router.push(`/edit-listing/${id}`)
  }

  const uniqueBrands = Array.from(new Set(listings.map(l => l.title))).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {t('myListingsTitle')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('manageYourListings')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {dealerInfo && (
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-2 rounded-lg">
                  <div className="text-xs text-gray-600 mb-0.5">{t('activeListings')}</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {dealerInfo.active_count}
                    {dealerInfo.max_listings !== null && dealerInfo.subscription_status !== 'trialing' && (
                      <span className="text-sm text-gray-600"> / {dealerInfo.max_listings}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('status')}</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value as FilterOptions['status']})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">{t('all')}</option>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>

            {/* Vehicle Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('vehicleType')}</label>
              <select
                value={filters.vehicleType}
                onChange={(e) => setFilters({...filters, vehicleType: e.target.value as FilterOptions['vehicleType']})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">{t('allVehicles')}</option>
                <option value="car">{t('cars')}</option>
                <option value="motorcycle">{t('motorcycles')}</option>
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('brand')}</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters({...filters, brand: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">{t('all')}</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('sortBy')}</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value as FilterOptions['sortBy']})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="newest">{t('newestFirst')}</option>
                <option value="oldest">{t('oldestFirst')}</option>
                <option value="price_asc">{t('priceLowToHigh')}</option>
                <option value="price_desc">{t('priceHighToLow')}</option>
                <option value="name_asc">{t('nameAZ')}</option>
                <option value="name_desc">{t('nameZA')}</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({status: 'all', vehicleType: 'all', brand: '', sortBy: 'newest'})}
                className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                {t('resetFilters')}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-blue-900">
                  {selectedIds.length} {t('selected')}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleBulkActivate}
                  className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('activate')}
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t('deactivate')}
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition text-sm"
                >
                  {t('clear')}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noListingsYet')}</h3>
            <p className="text-gray-600 mb-6">{t('tryAdjustingFilters')}</p>
            <button
              onClick={() => router.push('/dealer/add-listing')}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition"
            >
              {t('addNewListing')}
            </button>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="bg-white rounded-t-xl shadow-md p-3 border-b">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredListings.length && filteredListings.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {t('selectAll')} ({filteredListings.length})
                </span>
              </label>
            </div>

            {/* Compact Listings Grid */}
            <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredListings.map((listing) => {
                  const stateObj = listing.state_id ? states.find(s => s.id === listing.state_id) : null
                  const stateName = stateObj ? stateObj.code : 'N/A'
                  
                  return (
                    <div
                      key={listing.id}
                      className={`p-3 hover:bg-gray-50 transition ${!listing.is_active ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(listing.id)}
                          onChange={() => handleSelectOne(listing.id)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Image */}
                        <div className="w-16 h-12 flex-shrink-0 relative">
                          {listing.image_url ? (
                            <Image
                              src={listing.image_url}
                              alt={listing.title}
                              fill
                              className="object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                          <div className="col-span-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{listing.title}</h3>
                            <p className="text-xs text-gray-500">{listing.model || 'N/A'}</p>
                          </div>
                          <div className="text-sm text-gray-600">{listing.year}</div>
                          <div className="text-sm font-semibold text-orange-600">${listing.price.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{stateName}</div>
                          <div className="flex items-center gap-1">
                            {listing.is_active ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                {t('active')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                {t('inactive')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => handleEdit(listing.id)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">{t('edit')}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
