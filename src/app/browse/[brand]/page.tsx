'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import PriceBadge from '@/components/PriceBadge';

type Listing = {
  id: string;
  title: string;
  model?: string;
  year?: number;
  price: number;
  created_at: string;
  state?: {
    name: string;
    code: string;
    country_code: string;
  } | null;
  city?: string | null;
  image_url?: string;
  is_external?: boolean;
  external_source?: string;
  external_url?: string;
  user_type?: string;
  brand?: string | null;
  vehicle_type?: string;
};

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const brandParam = params?.brand as string;
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const brandName = brandParam ? decodeURIComponent(brandParam).toLowerCase() : '';
  const brandDisplay = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  useEffect(() => {
    if (!brandName) return;

    const fetchListings = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch from regular listings table
        const { data: ownListings, error: ownError } = await supabase
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
            created_at,
            vehicle_type,
            user_id,
            states (name, code, country_code),
            cities (name),
            listing_images (image_url)
          `)
          .eq('is_active', true)
          .ilike('title', `${brandName}%`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (ownError) throw ownError;

        // Fetch from external_listings table
        const { data: externalListings, error: externalError } = await supabase
          .from('external_listings')
          .select(`
            id,
            title,
            brand,
            model,
            year,
            price,
            state_id,
            city_id,
            city_name,
            image_url,
            source,
            external_url,
            created_at,
            vehicle_type,
            states (name, code, country_code)
          `)
          .eq('is_active', true)
          .or(`brand.ilike.${brandName},title.ilike.${brandName}%`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (externalError) throw externalError;

        // Format own listings
        const formattedOwn: Listing[] = (ownListings || []).map((item) => {
          let stateObj = null;
          if (item.states) {
            if (Array.isArray(item.states) && item.states.length > 0) {
              stateObj = item.states[0] as { name: string; code: string; country_code: string };
            } else if (typeof item.states === 'object' && 'name' in item.states) {
              stateObj = item.states as unknown as { name: string; code: string; country_code: string };
            }
          }

          let city: string | null = null;
          if (item.city_name) {
            city = item.city_name;
          } else if (item.cities && typeof item.cities === 'object' && 'name' in item.cities) {
            city = (item.cities as { name: string }).name;
          }

          return {
            id: item.id,
            title: item.title,
            brand: item.title?.split(' ')[0] || brandDisplay,
            model: item.model || undefined,
            year: item.year || undefined,
            price: item.price,
            created_at: item.created_at,
            vehicle_type: item.vehicle_type || 'car',
            state: stateObj,
            city,
            image_url: Array.isArray(item.listing_images) && item.listing_images[0]?.image_url
              ? item.listing_images[0].image_url
              : undefined,
            is_external: false,
            user_type: 'individual',
          };
        });

        // Format external listings
        const formattedExternal: Listing[] = (externalListings || []).map((item) => {
          let stateObj = null;
          if (item.states) {
            if (Array.isArray(item.states) && item.states.length > 0) {
              stateObj = item.states[0] as { name: string; code: string; country_code: string };
            } else if (typeof item.states === 'object' && 'name' in item.states) {
              stateObj = item.states as unknown as { name: string; code: string; country_code: string };
            }
          }

          return {
            id: `ext-${item.id}`,
            title: item.title,
            brand: item.brand || brandDisplay,
            model: item.model || undefined,
            year: item.year || undefined,
            price: item.price,
            created_at: item.created_at,
            vehicle_type: item.vehicle_type || 'car',
            state: stateObj,
            city: item.city_name || null,
            image_url: item.image_url || undefined,
            is_external: true,
            external_source: item.source,
            external_url: item.external_url || undefined,
            user_type: 'dealer',
          };
        });

        // Combine and sort by date
        const allListings = [...formattedOwn, ...formattedExternal].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setListings(allListings);
        setTotalCount(allListings.length);
      } catch (err) {
        console.error('Error fetching brand listings:', err);
        setError('Failed to load listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [brandName, brandDisplay]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 pt-header">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700">Loading {brandDisplay} listings...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 pt-header">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-orange-600 hover:text-orange-700 underline"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 pt-header">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/search-results" className="hover:text-orange-600">Browse</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{brandDisplay}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {brandDisplay} Vehicles for Sale
          </h1>
          <p className="text-gray-600 text-lg">
            {totalCount} {totalCount === 1 ? 'listing' : 'listings'} available
          </p>
          
          {/* SEO Description */}
          <div className="mt-4 bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-orange-100">
            <p className="text-gray-700">
              Browse {brandDisplay} cars, trucks, SUVs, and motorcycles for sale. 
              Find the best deals from trusted sellers and dealers across the country. 
              All listings verified and updated daily.
            </p>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No {brandDisplay} listings found.</p>
            <Link
              href="/search-results"
              className="text-orange-600 hover:text-orange-700 underline"
            >
              Browse all listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {listing.image_url ? (
                    <Image
                      src={listing.image_url}
                      alt={`${listing.year} ${listing.title}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {listing.is_external && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Partner
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {listing.year} {listing.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <PriceBadge 
                      brand={listing.brand || listing.title?.split(' ')[0] || null}
                      model={listing.model || null}
                      year={listing.year || null}
                      price={listing.price}
                    />
                  </div>

                  {listing.city && listing.state && (
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {listing.city}, {listing.state.code}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    Listed by {listing.user_type === 'dealer' ? 'Dealer' : 'Individual'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
