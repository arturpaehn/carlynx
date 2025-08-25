'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
  image_url: string | null
}

type State = {
  id: number
  code: string
  name: string
  country_code: string
}

export default function MyListingsPage() {
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
        return
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
        return
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

  return (
    <div className="min-h-screen bg-[#fff2e0] pt-40 mt-[-40px] px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">My Listings</h1>
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : listings.length === 0 ? (
          <p className="text-center">You have no listings.</p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Активные объявления */}
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
                  className="flex flex-col sm:flex-row items-center p-2 sm:p-4 rounded shadow gap-2 sm:gap-4 bg-white cursor-pointer hover:bg-orange-50 transition"
                  onClick={() => router.push(`/listing/${listing.id}?from=my`)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/listing/${listing.id}?from=my`) }}
                >
                  {listing.image_url ? (
                    <Image
                      src={listing.image_url}
                      alt="Listing"
                      width={128}
                      height={96}
                      className="w-full sm:w-32 h-24 object-cover rounded mb-2 sm:mb-0"
                      style={{ minWidth: '6rem', background: '#eee' }}
                    />
                  ) : (
                    <div className="w-full sm:w-32 h-24 bg-gray-300 rounded flex items-center justify-center text-sm text-gray-600 mb-2 sm:mb-0">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 w-full">
                    <h2 className="text-base sm:text-lg font-semibold">{listing.title}</h2>
                    <p className="text-xs sm:text-sm">Model: {listing.model || 'N/A'}</p>
                    <p className="text-xs sm:text-sm">Price: ${listing.price}</p>
                    <p className="text-xs sm:text-sm">Year: {listing.year}</p>
                    <p className="text-xs sm:text-sm">State: {stateName}{countryLabel}</p>
                    <p className="text-xs sm:text-sm">Transmission: {listing.transmission}</p>
                    <p className="text-xs sm:text-sm">Fuel: {listing.fuel_type}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(listing.id); }}
                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
            {/* Неактивные объявления */}
            {listings.some((l) => !l.is_active) && (
              <h3 className="text-center text-gray-700 font-semibold mt-6 sm:mt-8 mb-1 sm:mb-2">
                My inactive listings
              </h3>
            )}
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
                  className="flex flex-col sm:flex-row items-center p-2 sm:p-4 rounded shadow gap-2 sm:gap-4 bg-gray-100 opacity-70"
                >
                  {listing.image_url ? (
                    <Image
                      src={listing.image_url}
                      alt="Listing"
                      width={128}
                      height={96}
                      className="w-full sm:w-32 h-24 object-cover rounded mb-2 sm:mb-0"
                      style={{ minWidth: '6rem', background: '#eee' }}
                    />
                  ) : (
                    <div className="w-full sm:w-32 h-24 bg-gray-300 rounded flex items-center justify-center text-sm text-gray-600 mb-2 sm:mb-0">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 w-full">
                    <h2 className="text-base sm:text-lg font-semibold">
                      {listing.title}{' '}
                      <span className="text-xs sm:text-sm text-red-500">(inactive)</span>
                    </h2>
                    <p className="text-xs sm:text-sm">Model: {listing.model || 'N/A'}</p>
                    <p className="text-xs sm:text-sm">Price: ${listing.price}</p>
                    <p className="text-xs sm:text-sm">Year: {listing.year}</p>
                    <p className="text-xs sm:text-sm">State: {stateName}{countryLabel}</p>
                    <p className="text-xs sm:text-sm">Transmission: {listing.transmission}</p>
                    <p className="text-xs sm:text-sm">Fuel: {listing.fuel_type}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
