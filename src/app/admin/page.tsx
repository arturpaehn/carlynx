
'use client'

type Listing = { id: string; is_active: boolean; created_at: string; views?: number; title?: string; price?: number; vehicle_type?: string };
type UserProfile = { user_id: string; is_blocked: boolean; created_at?: string; email?: string; user_type?: string };
type TopViewedListing = { id: string | number; title?: string; price?: number; views?: number; is_active?: boolean; source: string; listing_id: string };
type RecentUser = { user_id: string; email?: string; user_type?: string; created_at?: string };

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Helper for month labels
function getMonthLabels(num: number) {
  const now = new Date();
  const arr = [];
  for (let i = num - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }
  return arr;
}


export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<null | {
    total: number;
    active: number;
    inactive: number;
    last30: number;
    today: number;
  }>(null);
  const [userStats, setUserStats] = useState<null | {
    total: number;
    blocked: number;
    notBlocked: number;
  }>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [userStatsLoading, setUserStatsLoading] = useState(true);
  const [monthly, setMonthly] = useState<number[] | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);
  
  // New features state
  const [topViewedListings, setTopViewedListings] = useState<TopViewedListing[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [sourcesBreakdown, setSourcesBreakdown] = useState<Record<string, number> | null>(null);
  const [avgPriceByType, setAvgPriceByType] = useState<Record<string, number> | null>(null);
  const [featuresLoading, setFeaturesLoading] = useState(true);

  useEffect(() => {
    // Generate month labels on client to avoid hydration mismatch
    setMonthLabels(getMonthLabels(6));
  }, []);

  useEffect(() => {
    async function checkAdmin() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email;
      setIsAdmin(email === "admin@carlynx.us");
      setLoading(false);
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      setMonthlyLoading(true);
      setUserStatsLoading(true);
      
      // 1. Fetch regular listings
      const { data: all, error: err1 } = await supabase.from('listings').select('id, is_active, created_at');
      
      // 2. Fetch external listings
      const { data: externalAll, error: err2 } = await supabase.from('external_listings').select('id, is_active, created_at');
      
      if ((!all || err1) && (!externalAll || err2)) {
        setStats(null);
        setMonthly(null);
        setStatsLoading(false);
        setMonthlyLoading(false);
      } else {
        const regularListings = all || [];
        const externalListings = externalAll || [];
        
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const total = regularListings.length + externalListings.length;
        const active = (regularListings as Listing[]).filter((l) => l.is_active).length + 
                       (externalListings as Listing[]).filter((l) => l.is_active).length;
        const inactive = total - active;
        const last30count = (regularListings as Listing[]).filter((l) => l.created_at && new Date(l.created_at) >= last30).length +
                           (externalListings as Listing[]).filter((l) => l.created_at && new Date(l.created_at) >= last30).length;
        const todayCount = (regularListings as Listing[]).filter((l) => l.created_at && l.created_at.slice(0, 10) === todayStr).length +
                          (externalListings as Listing[]).filter((l) => l.created_at && l.created_at.slice(0, 10) === todayStr).length;
        
        setStats({ total, active, inactive, last30: last30count, today: todayCount });
        setStatsLoading(false);

        // 2. Monthly chart (last 6 months) - NEW LISTINGS ONLY (by unique ID, not updates)
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            year: d.getFullYear(),
            month: d.getMonth(),
          });
        }
        
        const counts = months.map(({ year, month }) => {
          const regularCount = (regularListings as Listing[]).filter((l) => {
            if (!l.created_at) return false;
            const dt = new Date(l.created_at);
            return dt.getFullYear() === year && dt.getMonth() === month;
          }).length;
          
          const externalCount = (externalListings as Listing[]).filter((l) => {
            if (!l.created_at) return false;
            const dt = new Date(l.created_at);
            return dt.getFullYear() === year && dt.getMonth() === month;
          }).length;
          
          return regularCount + externalCount;
        });
        
        setMonthly(counts);
        setMonthlyLoading(false);
      }

      // 3. User stats
      const { data: users, error: userErr } = await supabase.from('user_profiles').select('user_id, is_blocked');
      if (!users || userErr) {
        setUserStats(null);
        setUserStatsLoading(false);
        return;
      }
      const totalUsers = users.length;
      const blocked = (users as UserProfile[]).filter((u) => u.is_blocked).length;
      const notBlocked = (users as UserProfile[]).filter((u) => !u.is_blocked).length;
      setUserStats({ total: totalUsers, blocked, notBlocked });
      setUserStatsLoading(false);
      
      // 4. Fetch additional features
      fetchAdditionalFeatures();
    }
    fetchStats();
  }, []);
  
  // Separate function for additional features
  async function fetchAdditionalFeatures() {
    setFeaturesLoading(true);
    
    try {
      // Top 10 most viewed listings (regular + external)
      const [{ data: topRegular }, { data: topExternal }] = await Promise.all([
        supabase.from('listings').select('id,title,price,views,is_active').order('views', { ascending: false }).limit(10),
        supabase.from('external_listings').select('id,title,price,views,is_active').order('views', { ascending: false }).limit(10)
      ]);
      
      const combined = [
        ...(topRegular || []).map(l => ({ ...l, source: 'User', listing_id: l.id })),
        ...(topExternal || []).map(l => ({ ...l, source: 'External', listing_id: `ext-${l.id}` }))
      ].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
      
      setTopViewedListings(combined);
      
      // Recent 10 users
      const { data: recent } = await supabase
        .from('user_profiles')
        .select('user_id,email,user_type,created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentUsers(recent || []);
      
      // Sources breakdown
      const [{ count: regularCount }, { data: externalBySource }] = await Promise.all([
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('external_listings').select('source')
      ]);
      
      const sources: Record<string, number> = {
        'User Listings': regularCount || 0
      };
      
      (externalBySource || []).forEach((item: { source: string }) => {
        sources[item.source] = (sources[item.source] || 0) + 1;
      });
      
      setSourcesBreakdown(sources);
      
      // Average price by vehicle type
      const [{ data: allListings }, { data: allExternal }] = await Promise.all([
        supabase.from('listings').select('price,vehicle_type'),
        supabase.from('external_listings').select('price,vehicle_type')
      ]);
      
      const allVehicles = [...(allListings || []), ...(allExternal || [])];
      const priceByType: Record<string, { total: number; count: number }> = {};
      
      allVehicles.forEach((v: { price?: number; vehicle_type?: string }) => {
        if (v.price && v.vehicle_type) {
          if (!priceByType[v.vehicle_type]) {
            priceByType[v.vehicle_type] = { total: 0, count: 0 };
          }
          priceByType[v.vehicle_type].total += v.price;
          priceByType[v.vehicle_type].count += 1;
        }
      });
      
      const avgPrices: Record<string, number> = {};
      Object.keys(priceByType).forEach(type => {
        avgPrices[type] = Math.round(priceByType[type].total / priceByType[type].count);
      });
      
      setAvgPriceByType(avgPrices);
    } catch (error) {
      console.error('Failed to fetch additional features:', error);
    } finally {
      setFeaturesLoading(false);
    }
  }

  if (loading) {
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
    <div className="p-6 max-w-6xl mx-auto pt-header">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Listings</div>
          <div className="text-3xl font-bold text-blue-600">
            {statsLoading ? '...' : stats ? stats.total : 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {statsLoading ? '' : stats ? `${stats.active} active, ${stats.inactive} inactive` : ''}
          </div>
        </div>
        
        <div className="bg-white border-2 border-green-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">New This Month</div>
          <div className="text-3xl font-bold text-green-600">
            {statsLoading ? '...' : stats ? stats.last30 : 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {statsLoading ? '' : stats ? `${stats.today} added today` : ''}
          </div>
        </div>
        
        <div className="bg-white border-2 border-purple-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-3xl font-bold text-purple-600">
            {userStatsLoading ? '...' : userStats ? userStats.total : 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {userStatsLoading ? '' : userStats ? `${userStats.blocked} blocked` : ''}
          </div>
        </div>
      </div>
      
      {/* Detailed Stats */}
      <div className="mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded p-4 flex flex-col sm:flex-row gap-2 sm:gap-8 text-sm sm:text-base">
          {/* Listings stats */}
          {statsLoading ? (
            <span>Loading analytics...</span>
          ) : stats ? (
            <>
              <span><b>Total listings:</b> {stats.total}</span>
              <span><b>Active:</b> {stats.active}</span>
              <span><b>Inactive:</b> {stats.inactive}</span>
              <span><b>Added last 30 days:</b> {stats.last30}</span>
              <span><b>Added today:</b> {stats.today}</span>
            </>
          ) : (
            <span className="text-red-500">Failed to load analytics</span>
          )}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded p-4 flex flex-col sm:flex-row gap-2 sm:gap-8 text-sm sm:text-base mt-4">
          {/* Users stats */}
          {userStatsLoading ? (
            <span>Loading user stats...</span>
          ) : userStats ? (
            <>
              <span><b>Total users:</b> {userStats.total}</span>
              <span><b>Blocked:</b> {userStats.blocked}</span>
              <span><b>Not blocked:</b> {userStats.notBlocked}</span>
            </>
          ) : (
            <span className="text-red-500">Failed to load user stats</span>
          )}
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Main Sections</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/admin/users" className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-center">
            👥 Users
          </Link>
          <Link href="/admin/listings" className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-center">
            📋 Listings
          </Link>
          <Link href="/admin/dealercenter-logs" className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-center">
            📊 DealerCenter Logs
          </Link>
        </div>
        
        <h2 className="text-lg font-semibold mb-3 mt-6">Tools & Analytics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/cleanup" className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-center">
            🗑️ Cleanup
          </Link>
          <Link href="/admin/export" className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-center">
            📥 Export CSV
          </Link>
          <Link href="/admin/inactive" className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-center">
            ⚠️ Inactive
          </Link>
          <Link href="/admin/search" className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-center">
            🔍 Search
          </Link>
          <Link href="/admin/price-distribution" className="px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors text-center">
            📊 Prices
          </Link>
          <Link href="/admin/fraud" className="px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors text-center">
            🚨 Fraud
          </Link>
          <Link href="/admin/activity" className="px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors text-center">
            ⏰ Activity
          </Link>
          <Link href="/admin/revenue" className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-center">
            💵 Revenue
          </Link>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 rounded p-4 flex flex-col items-center">
          <div className="mb-2 font-bold text-base">New listings added per month (last 6 months)</div>
          <div className="text-xs text-gray-500 mb-2">Includes regular + external listings (unique IDs only)</div>
          {monthlyLoading ? (
            <span>Loading chart...</span>
          ) : monthly ? (
            <svg width={320} height={120} className="block w-full max-w-[340px] h-[120px]">
              {monthly.map((val, i) => {
                const max = Math.max(...monthly, 1);
                const barHeight = Math.round((val / max) * 60);
                // Always leave at least 18px for the number above the bar
                const barBottom = 90;
                const barTop = barBottom - barHeight;
                const numberY = Math.max(barTop - 8, 18); // never above 18px from top
                return (
                  <g key={i}>
                    <text x={34 + i * 45} y={numberY} textAnchor="middle" fontSize="13" fill="#222" fontWeight="bold">
                      {val}
                    </text>
                    <rect x={20 + i * 45} y={barTop} width={28} height={barHeight} fill="#f59e42" rx={4} />
                    <text x={34 + i * 45} y={105} textAnchor="middle" fontSize="11" fill="#555">
                      {monthLabels[i] || ''}
                    </text>
                  </g>
                );
              })}
              {/* Y axis line */}
              <line x1="15" y1="18" x2="15" y2="90" stroke="#bbb" strokeWidth="1" />
              {/* X axis line */}
              <line x1="15" y1="90" x2="295" y2="90" stroke="#bbb" strokeWidth="1" />
            </svg>
          ) : (
            <span className="text-red-500">Failed to load chart</span>
          )}
        </div>
      </div>
      
      {/* New Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Viewed Listings */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">👁️</span> Top 10 Most Viewed Listings
          </h2>
          {featuresLoading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : topViewedListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Title</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-center p-2">Views</th>
                    <th className="text-center p-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {topViewedListings.map((listing, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-2">
                        <a 
                          href={`/listing/${listing.listing_id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 hover:underline line-clamp-1"
                        >
                          {listing.title || 'Untitled'}
                        </a>
                      </td>
                      <td className="text-right p-2">${(listing.price || 0).toLocaleString()}</td>
                      <td className="text-center p-2 font-bold">{listing.views || 0}</td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-1 rounded text-xs ${listing.source === 'User' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {listing.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No data available</div>
          )}
        </div>

        {/* Recent User Registrations */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">👤</span> Recent User Registrations
          </h2>
          {featuresLoading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-center p-2">Type</th>
                    <th className="text-right p-2">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-2 truncate max-w-[150px]" title={user.email}>{user.email || 'N/A'}</td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-1 rounded text-xs ${user.user_type === 'dealer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.user_type || 'individual'}
                        </span>
                      </td>
                      <td className="text-right p-2 text-gray-600">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No data available</div>
          )}
        </div>
      </div>

      {/* Sources Breakdown & Avg Price */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Listing Sources Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">📊</span> Listing Sources
          </h2>
          {featuresLoading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : sourcesBreakdown ? (
            <div className="space-y-2">
              {Object.entries(sourcesBreakdown).map(([source, count]) => (
                <div key={source} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{source}</span>
                  <span className="text-lg font-bold text-blue-600">{count as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No data available</div>
          )}
        </div>

        {/* Average Price by Vehicle Type */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">💰</span> Avg Price by Vehicle Type
          </h2>
          {featuresLoading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : avgPriceByType ? (
            <div className="space-y-2">
              {Object.entries(avgPriceByType).map(([type, price]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium capitalize">{type}</span>
                  <span className="text-lg font-bold text-green-600">${(price as number).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
