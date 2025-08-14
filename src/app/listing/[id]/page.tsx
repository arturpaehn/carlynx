'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image';
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Listing = {
  id: number
  title: string
  model: string | null
  price: number
  year: number
  transmission: string
  fuel_type: string
  description: string | null
  user_id: string
  contact_by_phone: boolean
  contact_by_email: boolean
  views: number
  state?: {
    name: string
    code: string
    country_code: string
  } | null
}

type ListingImage = {
  listing_id: number
  image_url: string
}

type UserInfo = {
  full_name: string | null
  email: string | null
  phone: string | null
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = params && typeof params === 'object' && 'id' in params ? String((params as Record<string, string | string[]>).id) : '';
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listing, setListing] = useState<Listing | null>(null)
  const [images, setImages] = useState<ListingImage[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ownerInfo, setOwnerInfo] = useState<UserInfo | null>(null)

  const cameFromSearch = searchParams?.get('from') === 'search';
  const cameFromMy = searchParams?.get('from') === 'my';
  const queryParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
  queryParams.delete('from');
  const backSearchUrl = `/search-results${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const handleBack = () => {
    if (cameFromMy) {
      router.push('/my-listings');
    } else if (cameFromSearch) {
      router.push(backSearchUrl);
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true)
      setError('')

      // Сначала увеличиваем views
      await supabase.rpc('increment_listing_views', { listing_id_input: id });

      // Затем получаем объявление с views
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          model,
          price,
          year,
          transmission,
          fuel_type,
          description,
          user_id,
          contact_by_phone,
          contact_by_email,
          views,
          state_id,
          states (id, name, code, country_code)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setError('Failed to load listing.')
        setLoading(false)
        return
      }

      // Форматируем как на главной
      let stateObj: { name: string; code: string; country_code: string } | null = null;
      if (data.states) {
        if (Array.isArray(data.states) && data.states.length > 0 && typeof data.states[0] === 'object' && 'name' in data.states[0]) {
          stateObj = {
            name: data.states[0].name,
            code: data.states[0].code,
            country_code: data.states[0].country_code,
          };
        } else if (!Array.isArray(data.states) && typeof data.states === 'object' && 'name' in data.states) {
          const s = data.states as { name: string; code: string; country_code: string };
          stateObj = {
            name: s.name,
            code: s.code,
            country_code: s.country_code,
          };
        }
      }
      setListing({ ...data, state: stateObj });

      const { data: imageData } = await supabase
        .from('listing_images')
        .select('listing_id, image_url')
        .eq('listing_id', id)

      setImages(imageData || [])
      setLoading(false)
    }

    if (id) fetchListing()
  }, [id])

useEffect(() => {

  const fetchOwnerInfo = async () => {
    if (!listing?.user_id) return;

    // Загружаем имя, телефон и email из user_profiles
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('name, phone, email')
      .eq('user_id', listing.user_id)
      .single();

    if (profileData) {
      setOwnerInfo({
        full_name: profileData.name || '',
        phone: profileData.phone || '',
        email: profileData.email || '',
      });
    } else if (listing?.user_id === 'e8799652-9d86-4806-8196-a77fdfa1f84a') {
      setOwnerInfo({
        full_name: 'Mr Artur Paehn',
        phone: '55532171',
        email: '',
      });
    } else {
      setOwnerInfo({
        full_name: '',
        phone: '',
        email: '',
      });
    }
  }

  fetchOwnerInfo()
}, [listing])


  if (loading) return <div className="pt-48 text-center">Loading...</div>
  if (error || !listing)
    return (
      <div className="pt-48 text-center text-red-500">
        {error || 'Listing not found.'}
      </div>
    )

  return (
    <div className="min-h-screen bg-[#fff2e0] pt-48 mt-[-48px] px-6 max-w-4xl mx-auto">
      <button
        onClick={handleBack}
        className="mb-4 text-blue-600 hover:underline text-sm"
      >
        ← {cameFromMy ? 'Back to My Listings' : cameFromSearch ? 'Back to Search Results' : 'Back to Home'}
      </button>

      <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {images.map((img, index) => (
            <Image
              key={index}
              src={img.image_url}
              alt={`Listing ${index}`}
              width={400}
              height={192}
              onClick={() => setSelectedImage(img.image_url)}
              className="w-full h-48 object-contain rounded cursor-pointer hover:opacity-80"
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      ) : (
        <div className="mb-6 text-gray-500">No images available.</div>
      )}

      {/* Views badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          {listing.views} views
        </span>
      </div>

      <div className="bg-white p-6 rounded shadow space-y-2">
        <p><strong>Model:</strong> {listing.model || 'N/A'}</p>
        <p><strong>Price:</strong> ${listing.price}</p>
        <p><strong>Year:</strong> {listing.year}</p>
        {listing.state && (
          <p><strong>State:</strong> {listing.state.name} ({listing.state.country_code === 'US' ? 'USA' : listing.state.country_code === 'MX' ? 'Mexico' : listing.state.country_code})</p>
        )}
        <p><strong>Transmission:</strong> {listing.transmission}</p>
        <p><strong>Fuel Type:</strong> {listing.fuel_type}</p>
        <p><strong>Description:</strong> {listing.description || 'No description provided.'}</p>

        <div className="pt-4 border-t mt-4 space-y-1">
          <p><strong>Seller:</strong> {ownerInfo?.full_name || 'Unknown'}</p>
          {listing.contact_by_phone ? (
            <p><strong>Phone:</strong> {ownerInfo?.phone || 'Not provided'}</p>
          ) : null}
          {listing.contact_by_email ? (
            <p><strong>Email:</strong> {ownerInfo?.email || 'Not provided'}</p>
          ) : null}
        </div>
      </div>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        >
          <div className="relative max-w-4xl w-full">
            <Image src={selectedImage} alt="Full View" width={1200} height={800} className="w-full h-auto max-h-[90vh] object-contain rounded" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white text-black px-3 py-1 rounded shadow"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
