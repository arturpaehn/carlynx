'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

type HighAbuseUser = {
  user_id: string;
  email: string;
  abuse_attempts: number;
  created_at: string;
};

type DuplicateVin = {
  vin: string;
  count: number;
  listings: { id: string; title: string; source: string }[];
};

type CheapListing = {
  id: string;
  title: string;
  price: number;
  year: number;
  email: string;
  source: 'user' | 'external';
};

export default function FraudDetectionPage() {
  const [loading, setLoading] = useState(true);
  const [highAbuseUsers, setHighAbuseUsers] = useState<HighAbuseUser[]>([]);
  const [duplicateVins, setDuplicateVins] = useState<DuplicateVin[]>([]);
  const [cheapListings, setCheapListings] = useState<CheapListing[]>([]);

  useEffect(() => {
    fetchFraudData();
  }, []);

  async function fetchFraudData() {
    setLoading(true);
    try {
      // 1. High abuse attempts users
      const { data: abuseUsers } = await supabase
        .from('user_profiles')
        .select('user_id, email, abuse_attempts, created_at')
        .gt('abuse_attempts', 5)
        .order('abuse_attempts', { ascending: false })
        .limit(20);

      setHighAbuseUsers(abuseUsers || []);

      // 2. Duplicate VINs
      const { data: regularListings } = await supabase
        .from('listings')
        .select('id, title, vin')
        .not('vin', 'is', null)
        .eq('is_active', true);

      const { data: externalListings } = await supabase
        .from('external_listings')
        .select('id, title, vin, source')
        .not('vin', 'is', null)
        .eq('is_active', true);

      // Group by VIN
      const vinMap = new Map<string, { id: string; title: string; source: string }[]>();
      
      (regularListings || []).forEach((l: { id: string; title: string; vin: string }) => {
        if (!vinMap.has(l.vin)) vinMap.set(l.vin, []);
        vinMap.get(l.vin)!.push({ id: l.id, title: l.title, source: 'User' });
      });

      (externalListings || []).forEach((l: { id: number; title: string; vin: string; source: string }) => {
        if (!vinMap.has(l.vin)) vinMap.set(l.vin, []);
        vinMap.get(l.vin)!.push({ id: `ext-${l.id}`, title: l.title, source: l.source });
      });

      const duplicates = Array.from(vinMap.entries())
        .filter(([, listings]) => listings.length > 1)
        .map(([vin, listings]) => ({ vin, count: listings.length, listings }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      setDuplicateVins(duplicates);

      // 3. Suspiciously cheap listings (under $500)
      const { data: cheapRegular } = await supabase
        .from('listings')
        .select('id, title, price, year, user_id')
        .lt('price', 500)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(20);

      if (cheapRegular && cheapRegular.length > 0) {
        const userIds = [...new Set(cheapRegular.map((l: { user_id: string }) => l.user_id))];
        const { data: users } = await supabase
          .from('user_profiles')
          .select('user_id, email')
          .in('user_id', userIds);

        const userMap = new Map((users || []).map((u: { user_id: string; email: string }) => [u.user_id, u.email]));

        const enrichedCheap = cheapRegular.map((l: { id: string; title: string; price: number; year: number; user_id: string }) => ({
          ...l,
          email: userMap.get(l.user_id) || 'Unknown',
          source: 'user' as const
        }));

        setCheapListings(enrichedCheap);
      }
    } catch (error) {
      console.error('Error fetching fraud data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout title="Fraud Detection">
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
          <span className="mr-2">🚨</span> Fraud Detection Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Monitor suspicious activities and potential fraud indicators.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Analyzing data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* High Abuse Users */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <span className="mr-2">⚠️</span> High Abuse Attempts Users ({highAbuseUsers.length})
              </h2>
              {highAbuseUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-red-100">
                      <tr>
                        <th className="text-left p-3">Email</th>
                        <th className="text-center p-3">Abuse Attempts</th>
                        <th className="text-center p-3">Account Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highAbuseUsers.map((user) => (
                        <tr key={user.user_id} className="border-t hover:bg-gray-50">
                          <td className="p-3">{user.email}</td>
                          <td className="text-center p-3">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-bold">
                              {user.abuse_attempts}
                            </span>
                          </td>
                          <td className="text-center p-3 text-gray-600">
                            {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-green-50 rounded-lg">
                  ✅ No users with high abuse attempts found
                </div>
              )}
            </div>

            {/* Duplicate VINs */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <span className="mr-2">🔄</span> Duplicate VINs ({duplicateVins.length})
              </h2>
              {duplicateVins.length > 0 ? (
                <div className="space-y-3">
                  {duplicateVins.map((dup, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                      <div className="font-semibold mb-2 flex items-center justify-between">
                        <span className="font-mono text-sm">{dup.vin}</span>
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-bold">
                          {dup.count} duplicates
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dup.listings.map((listing, idx) => (
                          <div key={idx} className="text-sm flex items-center justify-between">
                            <span className="truncate flex-1">{listing.title}</span>
                            <span className="text-gray-600 text-xs ml-2">({listing.source})</span>
                            <a
                              href={`/listing/${listing.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-green-50 rounded-lg">
                  ✅ No duplicate VINs found
                </div>
              )}
            </div>

            {/* Suspiciously Cheap Listings */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <span className="mr-2">💰</span> Suspiciously Cheap Listings ({cheapListings.length})
              </h2>
              <div className="text-xs text-gray-600 mb-3">Listings priced under $500</div>
              {cheapListings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="text-left p-3">Title</th>
                        <th className="text-center p-3">Year</th>
                        <th className="text-right p-3">Price</th>
                        <th className="text-left p-3">Owner</th>
                        <th className="text-center p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cheapListings.map((listing) => (
                        <tr key={listing.id} className="border-t hover:bg-gray-50">
                          <td className="p-3">{listing.title || 'Untitled'}</td>
                          <td className="text-center p-3">{listing.year}</td>
                          <td className="text-right p-3 font-bold text-orange-600">
                            ${listing.price.toLocaleString()}
                          </td>
                          <td className="p-3 text-xs truncate max-w-[150px]">{listing.email}</td>
                          <td className="text-center p-3">
                            <a
                              href={`/listing/${listing.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                            >
                              Open →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-green-50 rounded-lg">
                  ✅ No suspiciously cheap listings found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
