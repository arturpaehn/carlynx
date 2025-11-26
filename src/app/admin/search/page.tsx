'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

type SearchResult = {
  id: string;
  title: string;
  price: number;
  year: number;
  vin?: string;
  is_active: boolean;
  user_id?: string;
  email?: string;
  source: 'user' | 'external';
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'title' | 'vin' | 'email'>('title');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      if (searchBy === 'email') {
        // Search by email - find user first, then their listings
        const { data: users } = await supabase
          .from('user_profiles')
          .select('user_id, email')
          .ilike('email', `%${searchQuery}%`);

        if (users && users.length > 0) {
          const userIds = users.map(u => u.user_id);
          const { data: listings } = await supabase
            .from('listings')
            .select('id, title, price, year, vin, is_active, user_id')
            .in('user_id', userIds);

          if (listings) {
            const enriched = listings.map((l: { id: string; title: string; price: number; year: number; vin?: string; is_active: boolean; user_id: string }) => ({
              ...l,
              email: users.find(u => u.user_id === l.user_id)?.email,
              source: 'user' as const
            }));
            setResults(enriched);
          }
        }
      } else {
        // Search in regular listings
        const query = supabase
          .from('listings')
          .select('id, title, price, year, vin, is_active, user_id');

        if (searchBy === 'title') {
          query.ilike('title', `%${searchQuery}%`);
        } else if (searchBy === 'vin') {
          query.ilike('vin', `%${searchQuery}%`);
        }

        const { data: regularListings } = await query;

        // Also search in external listings
        const externalQuery = supabase
          .from('external_listings')
          .select('id, title, price, year, vin, is_active, source');

        if (searchBy === 'title') {
          externalQuery.ilike('title', `%${searchQuery}%`);
        } else if (searchBy === 'vin') {
          externalQuery.ilike('vin', `%${searchQuery}%`);
        }

        const { data: externalListings } = await externalQuery;

        // Get user emails for regular listings
        if (regularListings && regularListings.length > 0) {
          const userIds = [...new Set(regularListings.map((l: { user_id: string }) => l.user_id))];
          const { data: users } = await supabase
            .from('user_profiles')
            .select('user_id, email')
            .in('user_id', userIds);

          const userMap = new Map(users?.map((u: { user_id: string; email: string }) => [u.user_id, u.email]) || []);

          const enrichedRegular = regularListings.map((l: { id: string; title: string; price: number; year: number; vin?: string; is_active: boolean; user_id: string }) => ({
            ...l,
            email: userMap.get(l.user_id),
            source: 'user' as const
          }));

          const enrichedExternal = (externalListings || []).map((l: { id: number; title: string; price: number; year: number; vin?: string; is_active: boolean; source: string }) => ({
            ...l,
            id: `ext-${l.id}`,
            email: l.source,
            source: 'external' as const
          }));

          setResults([...enrichedRegular, ...enrichedExternal]);
        } else if (externalListings && externalListings.length > 0) {
          const enrichedExternal = externalListings.map((l: { id: number; title: string; price: number; year: number; vin?: string; is_active: boolean; source: string }) => ({
            ...l,
            id: `ext-${l.id}`,
            email: l.source,
            source: 'external' as const
          }));
          setResults(enrichedExternal);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout title="Quick Search">
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
          <span className="mr-2">🔍</span> Quick Listing Search
        </h1>
        <p className="text-gray-600 mb-6">
          Search for listings by title, VIN, or owner email across all sources.
        </p>

        {/* Search Form */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value as 'title' | 'vin' | 'email')}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="title">Search by Title</option>
            <option value="vin">Search by VIN</option>
            <option value="email">Search by Owner Email</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Enter ${searchBy}...`}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="mb-3 text-sm text-gray-600">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3">Title</th>
                    <th className="text-center p-3">Year</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-left p-3">VIN</th>
                    <th className="text-left p-3">Owner/Source</th>
                    <th className="text-center p-3">Status</th>
                    <th className="text-center p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{result.title || 'Untitled'}</td>
                      <td className="text-center p-3">{result.year || 'N/A'}</td>
                      <td className="text-right p-3">${result.price?.toLocaleString() || '0'}</td>
                      <td className="p-3 font-mono text-xs">{result.vin || 'N/A'}</td>
                      <td className="p-3 truncate max-w-[150px]">{result.email || 'Unknown'}</td>
                      <td className="text-center p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${result.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {result.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <a
                          href={`/listing/${result.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors inline-block"
                        >
                          Open →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🔍</div>
            <div className="text-lg font-medium">No results found</div>
            <div className="text-sm">Try different keywords or search criteria</div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
