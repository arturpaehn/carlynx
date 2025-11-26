'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

type InactiveListing = {
  id: string;
  title: string;
  price: number;
  updated_at?: string;
  created_at: string;
  user_id: string;
  email: string;
  daysSinceUpdate: number;
};

export default function InactivePage() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'30' | '60' | '90'>('30');
  const [listings, setListings] = useState<InactiveListing[]>([]);
  const [reactivating, setReactivating] = useState<string | null>(null);

  useEffect(() => {
    fetchInactiveListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function fetchInactiveListings() {
    setLoading(true);
    
    const cutoffDate = new Date(Date.now() - Number(filter) * 24 * 60 * 60 * 1000);

    const { data: inactiveListings } = await supabase
      .from('listings')
      .select('id, title, price, created_at, updated_at, user_id')
      .eq('is_active', false);

    if (inactiveListings) {
      const filtered = inactiveListings.filter((l: { updated_at?: string; created_at: string }) => {
        const updateDate = new Date(l.updated_at || l.created_at);
        return updateDate < cutoffDate;
      });

      // Get user emails
      const userIds = [...new Set(filtered.map((l: { user_id: string }) => l.user_id))];
      const { data: users } = await supabase
        .from('user_profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const userMap = new Map(users?.map((u: { user_id: string; email: string }) => [u.user_id, u.email]) || []);

      const enriched = filtered.map((l: { id: string; title: string; price: number; updated_at?: string; created_at: string; user_id: string }) => ({
        ...l,
        email: userMap.get(l.user_id) || 'Unknown',
        daysSinceUpdate: Math.floor((Date.now() - new Date(l.updated_at || l.created_at).getTime()) / (24 * 60 * 60 * 1000))
      }));

      enriched.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
      setListings(enriched);
    }

    setLoading(false);
  }

  async function reactivateListing(id: string) {
    if (!confirm('Reactivate this listing?')) return;

    setReactivating(id);
    
    const { error } = await supabase
      .from('listings')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setListings(listings.filter(l => l.id !== id));
    } else {
      alert(`Error: ${error.message}`);
    }

    setReactivating(null);
  }

  return (
    <AdminLayout title="Inactive Listings">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Admin Panel
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2">⚠️</span> Inactive Listings Management
        </h1>
        <p className="text-gray-600 mb-6">
          Review and manage listings that have been inactive for a long time.
        </p>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('30')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === '30' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            30+ Days
          </button>
          <button
            onClick={() => setFilter('60')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === '60' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            60+ Days
          </button>
          <button
            onClick={() => setFilter('90')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === '90' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            90+ Days
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading listings...</p>
          </div>
        ) : listings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Title</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-left p-3">Owner Email</th>
                  <th className="text-center p-3">Days Inactive</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <a
                        href={`/listing/${listing.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {listing.title || 'Untitled'}
                      </a>
                    </td>
                    <td className="text-right p-3">${listing.price?.toLocaleString() || '0'}</td>
                    <td className="p-3 truncate max-w-[200px]">{listing.email}</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        listing.daysSinceUpdate >= 90 ? 'bg-red-100 text-red-700' :
                        listing.daysSinceUpdate >= 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {listing.daysSinceUpdate} days
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <button
                        onClick={() => reactivateListing(listing.id)}
                        disabled={reactivating === listing.id}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {reactivating === listing.id ? 'Reactivating...' : '✓ Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-gray-600">
              Showing {listings.length} inactive listing{listings.length !== 1 ? 's' : ''} older than {filter} days
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-lg font-medium">No inactive listings found!</div>
            <div className="text-sm">All listings older than {filter} days are already active or don&apos;t exist.</div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
