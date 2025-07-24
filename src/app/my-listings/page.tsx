'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Listing = {
  id: number
  title: string
  model: string | null
  price: number
  location: string
  year: number
  transmission: string
  fuel_type: string
  image_url: string | null
}

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
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

      const { data: userListings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (listingsError || !userListings) {
        setError('Failed to load listings.')
        setLoading(false)
        return
      }

      const listingIds = userListings.map(l => l.id)
      const { data: images } = await supabase
        .from('listing_images')
        .select('listing_id, image_url')
        .in('listing_id', listingIds)

      const listingsWithImages: Listing[] = userListings.map(l => {
        const image = images?.find(img => img.listing_id === l.id)
        return { ...l, image_url: image?.image_url || null }
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
    <div className="min-h-screen bg-[#fff2e0] pt-[224px] mt-[-224px] px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">My Listings</h1>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : listings.length === 0 ? (
          <p className="text-center">You have no active listings.</p>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center bg-white p-4 rounded shadow gap-4"
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

                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{listing.title}</h2>
                  <p>Model: {listing.model || 'N/A'}</p>
                  <p>Price: ${listing.price}</p>
                  <p>Year: {listing.year}</p>
                  <p>City: {listing.location}</p>
                  <p>Transmission: {listing.transmission}</p>
                  <p>Fuel: {listing.fuel_type}</p>
                </div>

                <button
                  onClick={() => handleEdit(listing.id)}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
