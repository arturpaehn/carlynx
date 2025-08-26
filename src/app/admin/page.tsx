
'use client'
export const dynamic = 'force-dynamic';
type Listing = { id: string; is_active: boolean; created_at: string };
type UserProfile = { user_id: string; is_blocked: boolean };


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
      // 1. Total, active, inactive, and monthly
      const { data: all, error: err1 } = await supabase.from('listings').select('id, is_active, created_at');
      if (!all || err1) {
        setStats(null);
        setMonthly(null);
        setStatsLoading(false);
        setMonthlyLoading(false);
      } else {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const total = all.length;
      const active = (all as Listing[]).filter((l) => l.is_active).length;
      const inactive = (all as Listing[]).filter((l) => !l.is_active).length;
      const last30count = (all as Listing[]).filter((l) => l.created_at && new Date(l.created_at) >= last30).length;
      const todayCount = (all as Listing[]).filter((l) => l.created_at && l.created_at.slice(0, 10) === todayStr).length;
      setStats({ total, active, inactive, last30: last30count, today: todayCount });
        setStatsLoading(false);

        // 2. Monthly chart (last 6 months)
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            year: d.getFullYear(),
            month: d.getMonth(),
          });
        }
        const counts = months.map(({ year, month }) =>
          (all as Listing[]).filter((l) => {
            if (!l.created_at) return false;
            const dt = new Date(l.created_at);
            return dt.getFullYear() === year && dt.getMonth() === month;
          }).length
        );
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
    }
    fetchStats();
  }, []);

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
    <div className="p-6 max-w-6xl mx-auto pt-40 md:pt-56">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
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
      <div className="flex gap-4 mb-8">
        <Link href="/admin/users" className="px-4 py-2 bg-blue-500 text-white rounded">Users</Link>
        <Link href="/admin/listings" className="px-4 py-2 bg-orange-500 text-white rounded">Listings</Link>
      </div>
      <div className="text-gray-500">Select an admin section</div>

      {/* Chart */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 rounded p-4 flex flex-col items-center">
          <div className="mb-2 font-bold text-base">Listings added per month (last 6 months)</div>
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
                      {getMonthLabels(6)[i]}
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
    </div>
  );
}
