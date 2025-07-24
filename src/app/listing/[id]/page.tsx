'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
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
  description: string | null
}

type ListingImage = {
  listing_id: number
  image_url: string
}

export default function ListingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const searchParams = useSearchParams()

  const [listing, setListing] = useState<Listing | null>(null)
  const [images, setImages] = useState<ListingImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cameFromSearch = searchParams.get('from') === 'search'

  // Собираем строку запроса без "from"
  const queryParams = new URLSearchParams(searchParams.toString())
  queryParams.delete('from')
  const backSearchUrl = `/search-results${queryParams.toString() ? '?' + queryParams.toString() : ''}`

  const handleBack = () => {
    if (cameFromSearch) {
      router.push(backSearchUrl)
    } else {
      router.push('/')
    }
  }

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Failed to load listing.')
        setLoading(false)
        return
      }

      setListing(data)

      const { data: imageData } = await supabase
        .from('listing_images')
        .select('listing_id, image_url')
        .eq('listing_id', id)

      setImages(imageData || [])
      setLoading(false)
    }

    if (id) fetchListing()
  }, [id])

  if (loading) return <div className="pt-[224px] text-center">Loading...</div>
  if (error || !listing)
    return (
      <div className="pt-[224px] text-center text-red-500">
        {error || 'Listing not found.'}
      </div>
    )

  return (
    <div className="min-h-screen bg-[#fff2e0] pt-[224px] mt-[-224px] px-6 max-w-4xl mx-auto">
      <button
        onClick={handleBack}
        className="mb-4 text-blue-600 hover:underline text-sm"
      >
        ← {cameFromSearch ? 'Back to Search Results' : 'Back to Home'}
      </button>

      <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {images.map((img, index) => (
            <img
              key={index}
              src={img.image_url}
              alt={`Listing ${index}`}
              className="w-full h-48 object-cover rounded"
            />
          ))}
        </div>
      ) : (
        <div className="mb-6 text-gray-500">No images available.</div>
      )}

      <div className="bg-white p-6 rounded shadow space-y-2">
        <p><strong>Model:</strong> {listing.model || 'N/A'}</p>
        <p><strong>Price:</strong> ${listing.price}</p>
        <p><strong>Year:</strong> {listing.year}</p>
        <p><strong>Location:</strong> {listing.location}</p>
        <p><strong>Transmission:</strong> {listing.transmission}</p>
        <p><strong>Fuel Type:</strong> {listing.fuel_type}</p>
        <p><strong>Description:</strong> {listing.description || 'No description provided.'}</p>
      </div>
    </div>
  )
}
