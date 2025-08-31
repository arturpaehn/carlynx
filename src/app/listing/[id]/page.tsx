'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import Image from 'next/image';
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { generateListingTitle, generateListingDescription, generateListingKeywords, updateMetaTags } from '@/lib/seoUtils'

type Listing = {
  id: number
  title: string
  model: string | null
  price: number
  year: number
  transmission: string
  fuel_type: string
  vehicle_type?: string
  engine_size?: number
  description: string | null
  user_id: string
  contact_by_phone: boolean
  contact_by_email: boolean
  views: number
  created_at?: string
  updated_at?: string
  state?: {
    name: string
    code: string
    country_code: string
  } | null
  brand_name?: string
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
        .from('listings_with_brands')
        .select(`
          id,
          title,
          model,
          price,
          year,
          transmission,
          fuel_type,
          vehicle_type,
          engine_size,
          description,
          user_id,
          contact_by_phone,
          contact_by_email,
          views,
          created_at,
          updated_at,
          state_id,
          states (id, name, code, country_code),
          car_brand (name),
          motorcycle_brand (name)
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

      // Определяем бренд
      let brandName: string | undefined = undefined;
      if (data.car_brand) {
        if (Array.isArray(data.car_brand) && data.car_brand[0]?.name) {
          brandName = data.car_brand[0].name;
        } else if (typeof data.car_brand === 'object' && 'name' in data.car_brand) {
          brandName = (data.car_brand as { name: string }).name;
        }
      } else if (data.motorcycle_brand) {
        if (Array.isArray(data.motorcycle_brand) && data.motorcycle_brand[0]?.name) {
          brandName = data.motorcycle_brand[0].name;
        } else if (typeof data.motorcycle_brand === 'object' && 'name' in data.motorcycle_brand) {
          brandName = (data.motorcycle_brand as { name: string }).name;
        }
      }
      
      const formattedListing = { 
        ...data, 
        state: stateObj, 
        brand_name: brandName 
      } as Listing;
      
      setListing(formattedListing);

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

// SEO мета-теги
useEffect(() => {
  if (listing && images) {
    const seoData = {
      id: listing.id.toString(),
      title: listing.title,
      model: listing.model || undefined,
      year: listing.year,
      price: listing.price,
      description: listing.description || undefined,
      state: listing.state,
      image_url: images[0]?.image_url,
      vehicle_type: listing.vehicle_type,
      brand_name: listing.brand_name,
      transmission: listing.transmission,
      fuel_type: listing.fuel_type,
      engine_size: listing.engine_size,
    };

    const title = generateListingTitle(seoData);
    const description = generateListingDescription(seoData);
    const keywords = generateListingKeywords(seoData);
    const canonicalUrl = `https://carlynx.us/listing/${listing.id}`;
    const imageUrl = images[0]?.image_url || 'https://carlynx.us/logo.png';

    updateMetaTags(title, description, keywords, imageUrl, canonicalUrl);
  }
}, [listing, images])


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-2 sm:px-4 lg:px-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading listing details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-2 sm:px-4 lg:px-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">Listing Not Found</h3>
            <p className="text-center text-red-600">{error || 'This listing is no longer available.'}</p>
            <div className="mt-6 text-center">
              <button
                onClick={handleBack}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-105"
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-2 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center px-4 py-2 bg-white/80 hover:bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {cameFromMy ? 'Back to My Listings' : cameFromSearch ? 'Back to Search Results' : 'Back to Home'}
          </button>
        </div>

        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{listing.model || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{listing.year}</span>
                </div>
                {listing.state && (
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{listing.state.name} ({listing.state.country_code === 'US' ? 'USA' : listing.state.country_code === 'MX' ? 'Mexico' : listing.state.country_code})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-2xl sm:text-3xl font-bold text-orange-600">${listing.price.toLocaleString()}</span>
              </div>

              {/* Views badge */}
              <div className="flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium shadow-sm">
                <svg className="h-4 w-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {listing.views} views
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photos
          </h2>
          
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div 
                  key={index} 
                  className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedImage(img.image_url)}
                >
                  <Image
                    src={img.image_url}
                    alt={`Listing ${index + 1}`}
                    width={400}
                    height={300}
                    className="w-full aspect-[4/3] object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No photos available</p>
              <p className="text-gray-400 text-sm">The seller hasn&apos;t uploaded any photos for this listing</p>
            </div>
          )}
        </div>

        {/* Car Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Technical Specifications */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Specifications
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Model</span>
                <span className="text-gray-900">{listing.model || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Year</span>
                <span className="text-gray-900">{listing.year}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Transmission</span>
                <span className="text-gray-900 capitalize">{listing.transmission}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 font-medium">Fuel Type</span>
                <span className="text-gray-900 capitalize">{listing.fuel_type}</span>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Seller Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Name</span>
                <span className="text-gray-900">{ownerInfo?.full_name || 'Not provided'}</span>
              </div>
              {listing.contact_by_phone && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone
                  </span>
                  <span className="text-gray-900">{ownerInfo?.phone || 'Not provided'}</span>
                </div>
              )}
              {listing.contact_by_email && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </span>
                  <span className="text-gray-900">{ownerInfo?.email || 'Not provided'}</span>
                </div>
              )}
              {!listing.contact_by_phone && !listing.contact_by_email && (
                <div className="text-center py-4 text-gray-500">
                  <svg className="h-8 w-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">Contact information not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Description
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {(listing.contact_by_phone || listing.contact_by_email) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contact Information
            </h2>
            <div className="space-y-3">
              {listing.contact_by_phone && ownerInfo?.phone && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center">
                    <div className="bg-orange-500 p-2 rounded-lg mr-3">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">Phone</p>
                      <p className="text-gray-900 font-semibold">{ownerInfo.phone}</p>
                    </div>
                  </div>
                </div>
              )}
              {listing.contact_by_email && ownerInfo?.email && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">Email</p>
                      <p className="text-gray-900 font-semibold">{ownerInfo.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="relative max-w-4xl max-h-full">
            <Image 
              src={selectedImage} 
              alt="Full View" 
              width={1200} 
              height={800} 
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" 
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-colors"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
