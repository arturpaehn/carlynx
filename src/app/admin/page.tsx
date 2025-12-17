
'use client'

type Listing = { id: string; is_active: boolean; created_at: string; views?: number; title?: string; price?: number; vehicle_type?: string };
type UserProfile = { user_id: string; is_blocked: boolean; created_at?: string; email?: string; user_type?: string };
type TopViewedListing = { id: string | number; title?: string; price?: number; views?: number; is_active?: boolean; source: string; listing_id: string };
type RecentUser = { user_id: string; email?: string; user_type?: string; created_at?: string };
type AnalyticsData = { period: string; stats: { totalVisits: number; uniqueVisitors: number; uniqueIPs: number; topPages: Array<{ path: string; count: number }> } };

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
  
  // Analytics state
  const [analyticsDay, setAnalyticsDay] = useState<AnalyticsData | null>(null);
  const [analyticsMonth, setAnalyticsMonth] = useState<AnalyticsData | null>(null);
  const [analyticsAll, setAnalyticsAll] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  
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

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      setAnalyticsLoading(true);
      try {
        const [dayRes, monthRes, allRes] = await Promise.all([
          fetch('/api/analytics?period=day'),
          fetch('/api/analytics?period=month'),
          fetch('/api/analytics?period=all')
        ]);

        const dayData = dayRes.ok ? await dayRes.json() : null;
        const monthData = monthRes.ok ? await monthRes.json() : null;
        const allData = allRes.ok ? await allRes.json() : null;

        if (dayData) setAnalyticsDay(dayData);
        if (monthData) setAnalyticsMonth(monthData);
        if (allData) setAnalyticsAll(allData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      setMonthlyLoading(true);
      setUserStatsLoading(true);
      
      // EXACTLY LIKE THE FOOTER - use count() queries only
      const { count: regularActive, error: err1 } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      const { count: externalActive, error: err2 } = await supabase
        .from('external_listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      const { count: regularInactive } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', false);
      
      const { count: externalInactive } = await supabase
        .from('external_listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', false);
      
      const active = (regularActive ?? 0) + (externalActive ?? 0);
      const inactive = (regularInactive ?? 0) + (externalInactive ?? 0);
      const total = active + inactive;
      
      setStats({ total, active, inactive, last30: 0, today: 0 });
      setStatsLoading(false);
      setMonthly([0, 0, 0, 0, 0, 0]); // Placeholder - no monthly data for now
      setMonthlyLoading(false);

      // 3. User stats
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true });
      
      setUserStats({ total: userCount ?? 0, blocked: 0, notBlocked: userCount ?? 0 });
      setUserStatsLoading(false);
      
      // 4. Fetch additional features (with proper error handling)
      fetchAdditionalFeatures();
    }
    fetchStats();
  }, []);
  
  // Separate function for additional features
  async function fetchAdditionalFeatures() {
    setFeaturesLoading(true);
    try {
      // Just set empty data - focus on main stats working first
      setTopViewedListings([]);
      setRecentUsers([]);
      setSourcesBreakdown({});
      setAvgPriceByType({});
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

      {/* Visitor Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border-2 border-orange-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Visitors Today</div>
          <div className="text-3xl font-bold text-orange-600">
            {analyticsLoading ? '...' : analyticsDay ? analyticsDay.stats.uniqueVisitors : 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {analyticsLoading ? '' : analyticsDay ? `${analyticsDay.stats.totalVisits} visits` : ''}
          </div>
        </div>
        
        <div className="bg-white border-2 border-amber-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Visitors This Month</div>
          <div className="text-3xl font-bold text-amber-600">
            {analyticsLoading ? '...' : analyticsMonth ? analyticsMonth.stats.uniqueVisitors : 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {analyticsLoading ? '' : analyticsMonth ? `${analyticsMonth.stats.totalVisits} visits` : ''}
          </div>
        </div>
        
        <div className="bg-white border-2 border-yellow-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">All-Time Visitors</div>
          <div className="text-3xl font-bold text-yellow-600">
            {analyticsLoading ? '...' : analyticsAll ? analyticsAll.stats.uniqueVisitors : 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {analyticsLoading ? '' : analyticsAll ? `${analyticsAll.stats.totalVisits} visits` : ''}
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
