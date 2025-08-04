"use client";
type UserEmail = { user_id: string; email: string };
type ListingImage = { listing_id: string; image_url: string };

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

interface Listing {
  id: string;
  user_id: string;
  title: string;
  price: number;
  description: string;
  created_at: string;
  transmission: string;
  fuel_type: string;
  mileage: number;
  year: number;
  model: string;
  is_active: boolean;
  contact_by_email: boolean;
  contact_by_phone: boolean;
  state_id: number;
  city_id: number;
  city_name: string;
  views: number;
  photo_url?: string;
  brand?: string;
}


export default function ListingsPage() {
  const [accessLoading, setAccessLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [listingImages, setListingImages] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'actions' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchCreated, setSearchCreated] = useState('');
  const LISTINGS_PER_PAGE = 25;

  useEffect(() => {
    async function checkAdmin() {
      setAccessLoading(true);
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email;
      setIsAdmin(email === "admin@carlynx.us");
      setAccessLoading(false);
    }
    checkAdmin();
  }, []);

  // Filtering logic
  function getFilteredListings(listings: Listing[]) {
    return listings.filter(listing => {
      const email = userEmails[listing.user_id]?.toLowerCase() || '';
      const created = listing.created_at ? new Date(listing.created_at).toLocaleDateString().toLowerCase() : '';
      const emailMatch = searchEmail.trim() === '' || email.includes(searchEmail.trim().toLowerCase());
      const createdMatch = searchCreated.trim() === '' || created.includes(searchCreated.trim().toLowerCase());
      return emailMatch && createdMatch;
    });
  }

  // Sorting logic
  function getSortedListings(listings: Listing[]) {
    const sorted = [...listings];
    if (sortBy === 'created_at') {
      sorted.sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      });
    } else if (sortBy === 'actions') {
      sorted.sort((a, b) => {
        if (sortOrder === 'asc') {
          return Number(a.is_active) - Number(b.is_active);
        } else {
          return Number(b.is_active) - Number(a.is_active);
        }
      });
    }
    return sorted;
  }

  const filteredListings = getFilteredListings(listings);
  const sortedListings = getSortedListings(filteredListings);
  const totalPages = Math.max(1, Math.ceil(sortedListings.length / LISTINGS_PER_PAGE));
  const pagedListings = sortedListings.slice((page - 1) * LISTINGS_PER_PAGE, page * LISTINGS_PER_PAGE);

  useEffect(() => {
    if (isAdmin) {
      fetchListings();
    }
    // eslint-disable-next-line
  }, [tab, isAdmin]);

  async function fetchListings() {
    setLoading(true);
    setError(null);
    // 1. Получаем все объявления
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', tab === 'active');
    if (listingsError) {
      setError(listingsError.message || JSON.stringify(listingsError));
      setListings([]);
      setLoading(false);
      return;
    }
    if (!listingsData || listingsData.length === 0) {
      setListings([]);
      setUserEmails({});
      setListingImages({});
      setLoading(false);
      return;
    }
    setListings(listingsData);
    setPage(1); // сбрасываем страницу при смене таба/фильтра
    // 2. Получаем email для всех user_id
    const userIds = Array.from(new Set(listingsData.map((l: Listing) => l.user_id)));
    const { data: usersData } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .in('user_id', userIds);
    const emails: Record<string, string> = {};
    (usersData as UserEmail[] | undefined)?.forEach((u) => {
      emails[u.user_id] = u.email;
    });
    setUserEmails(emails);

    // 3. Получаем первую картинку для каждого listing из listing_images
    const listingIds = listingsData.map((l: Listing) => l.id);
    let imagesMap: Record<string, string> = {};
    if (listingIds.length > 0) {
      const { data: imagesData } = await supabase
        .from('listing_images')
        .select('listing_id, image_url')
        .in('listing_id', listingIds);
      if (imagesData) {
        // Для каждого listing_id берём первую картинку
        const firstImageByListing: Record<string, string> = {};
        (imagesData as ListingImage[]).forEach((img) => {
          if (!firstImageByListing[img.listing_id]) {
            firstImageByListing[img.listing_id] = img.image_url;
          }
        });
        imagesMap = firstImageByListing;
      }
    }
    setListingImages(imagesMap);
    setLoading(false);
  }

  async function toggleListingActive(id: string, is_active: boolean) {
    await supabase.from('listings').update({ is_active: !is_active }).eq('id', id);
    fetchListings();
  }

  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center text-lg text-gray-600 font-bold border-2 border-gray-200 bg-white rounded shadow-lg">
          Checking access...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center text-lg text-red-600 font-bold border-2 border-red-300 bg-white rounded shadow-lg">
          Access denied. This page is for administrators only.
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-8 mt-16 sm:mt-24">
      <div className="mb-4">
        <a
          href="/admin"
          className="inline-block px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-150 text-xs sm:text-base"
        >
          ← Back to admin panel
        </a>
      </div>
      <div className="mb-4 flex gap-2 sm:gap-4 flex-wrap">
        <button
          className={`px-3 py-2 sm:px-4 sm:py-2 rounded-t text-xs sm:text-base ${tab === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => setTab('active')}
        >
          Active
        </button>
        <button
          className={`px-3 py-2 sm:px-4 sm:py-2 rounded-t text-xs sm:text-base ${tab === 'inactive' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => setTab('inactive')}
        >
          Inactive
        </button>
      </div>
      {error && (
        <div className="mb-4 p-2 sm:p-4 bg-red-100 text-red-700 border border-red-300 rounded text-xs sm:text-base">
          <div className="font-bold">Failed to load listings:</div>
          <div>{error}</div>
        </div>
      )}
      {/* Search controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-2 py-1 text-xs sm:text-sm w-full sm:w-56"
          placeholder="Search by user email..."
          value={searchEmail}
          onChange={e => { setSearchEmail(e.target.value); setPage(1); }}
        />
        <input
          type="text"
          className="border rounded px-2 py-1 text-xs sm:text-sm w-full sm:w-56"
          placeholder="Search by created date (e.g. 01.08.2025)..."
          value={searchCreated}
          onChange={e => { setSearchCreated(e.target.value); setPage(1); }}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead>
            <tr className="bg-orange-100">
              <th className="p-2 sm:p-2 border whitespace-nowrap">User Email</th>
              <th
                className={`p-2 sm:p-2 border cursor-pointer select-none transition-colors duration-150 whitespace-nowrap ${sortBy === 'created_at' ? 'bg-orange-300 text-orange-900 font-bold shadow-inner' : 'hover:bg-orange-200'}`}
                onClick={() => {
                  if (sortBy === 'created_at') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('created_at'); setSortOrder('asc'); }
                }}
                title="Sort by created date"
              >
                Created {sortBy === 'created_at' ? (sortOrder === 'asc' ? '▲' : '▼') : <span className="text-gray-400">⇅</span>}
              </th>
              <th className="p-2 sm:p-2 border whitespace-nowrap">Photo</th>
              <th className="p-2 sm:p-2 border whitespace-nowrap">Brand, Model, Year, Price</th>
              <th
                className={`p-2 sm:p-2 border cursor-pointer select-none transition-colors duration-150 whitespace-nowrap ${sortBy === 'actions' ? 'bg-orange-300 text-orange-900 font-bold shadow-inner' : 'hover:bg-orange-200'}`}
                onClick={() => {
                  if (sortBy === 'actions') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('actions'); setSortOrder('asc'); }
                }}
                title="Sort by status"
              >
                Actions {sortBy === 'actions' ? (sortOrder === 'asc' ? '▲' : '▼') : <span className="text-gray-400">⇅</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr>
            ) : listings.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-4">No listings found</td></tr>
            ) : (
              pagedListings.map(listing => (
                <tr key={listing.id} className="align-top hover:bg-orange-50 group">
                  <td
                    className="border p-2 break-all max-w-[120px] sm:max-w-none group-hover:underline cursor-pointer"
                    onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                  >
                    {userEmails[listing.user_id] || listing.user_id}
                  </td>
                  <td
                    className="border p-2 text-center whitespace-nowrap cursor-pointer"
                    onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                  >
                    {new Date(listing.created_at).toLocaleDateString()}
                  </td>
                  <td
                    className="border p-2 text-center cursor-pointer"
                    onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                  >
                    {listingImages[listing.id] ? (
                      <Image src={listingImages[listing.id]} alt="photo" width={60} height={40} className="object-cover rounded max-w-full h-auto mx-auto" />
                    ) : (
                      <span className="text-gray-400">No photo</span>
                    )}
                  </td>
                  <td
                    className="border p-2 text-xs sm:text-sm cursor-pointer"
                    onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                  >
                    <div className="break-words max-w-[140px] sm:max-w-none font-bold">{[listing.brand, listing.model, listing.year].filter(Boolean).join(' ')}</div>
                    <div className="text-gray-500">{listing.price ? `${listing.price.toLocaleString()} $` : ''}</div>
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      className={`px-2 py-1 sm:px-3 sm:py-1 rounded ${listing.is_active ? 'bg-red-500' : 'bg-green-500'} text-white text-xs sm:text-base`}
                      onClick={e => {
                        e.stopPropagation();
                        toggleListingActive(listing.id, listing.is_active);
                      }}
                    >
                      {listing.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="px-2 py-1 sm:px-3 sm:py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-base"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="mx-2 text-xs sm:text-base">Page {page} of {totalPages}</span>
          <button
            className="px-2 py-1 sm:px-3 sm:py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-base"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
