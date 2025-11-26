'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

type MonthlyRevenue = {
  month: string;
  revenue: number;
  count: number;
};

export default function RevenuePage() {
  const [loading, setLoading] = useState(true);
  const [hasSubscriptions, setHasSubscriptions] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [mrr, setMrr] = useState(0);

  useEffect(() => {
    checkSubscriptionsTable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkSubscriptionsTable() {
    setLoading(true);
    try {
      // Check if subscriptions table exists
      const { error } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist
        setHasSubscriptions(false);
      } else {
        // Table exists, fetch revenue data
        setHasSubscriptions(true);
        await fetchRevenueData();
      }
    } catch (error) {
      console.error('Error checking subscriptions table:', error);
      setHasSubscriptions(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRevenueData() {
    try {
      // Fetch all subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!subscriptions || subscriptions.length === 0) {
        return;
      }

      // Calculate total revenue
      const total = subscriptions.reduce((sum: number, sub: { amount?: number }) => sum + (sub.amount || 0), 0);
      setTotalRevenue(total);
      setTotalSubscriptions(subscriptions.length);

      // Count active subscriptions
      const active = subscriptions.filter((sub: { status?: string }) => sub.status === 'active').length;
      setActiveSubscriptions(active);

      // Calculate MRR (assuming monthly subscriptions)
      const monthlyRevenue = subscriptions
        .filter((sub: { status?: string; amount?: number }) => sub.status === 'active' && sub.amount)
        .reduce((sum: number, sub: { amount?: number }) => sum + (sub.amount || 0), 0);
      setMrr(monthlyRevenue);

      // Group by month
      const monthMap = new Map<string, { revenue: number; count: number }>();
      subscriptions.forEach((sub: { created_at?: string; amount?: number }) => {
        if (sub.created_at) {
          const date = new Date(sub.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, { revenue: 0, count: 0 });
          }
          const current = monthMap.get(monthKey)!;
          current.revenue += sub.amount || 0;
          current.count++;
        }
      });

      const monthlyArray = Array.from(monthMap.entries())
        .map(([key, data]) => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return {
            month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            revenue: data.revenue,
            count: data.count
          };
        })
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 12);

      setMonthlyData(monthlyArray);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  }

  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  return (
    <AdminLayout title="Revenue Dashboard">
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
          <span className="mr-2">💵</span> Revenue Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Track subscription revenue and financial metrics.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading revenue data...</p>
          </div>
        ) : !hasSubscriptions ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-xl font-semibold text-gray-700 mb-2">
              Revenue Tracking Not Set Up
            </div>
            <div className="text-gray-600 mb-6">
              The subscriptions table doesn&apos;t exist yet. This feature will be available once you implement a subscription system.
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 To Enable Revenue Tracking:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Create a <code className="bg-blue-100 px-1 rounded">subscriptions</code> table in Supabase</li>
                <li>Add columns: user_id, amount, status, created_at</li>
                <li>Implement subscription creation logic</li>
                <li>Refresh this page to see revenue data</li>
              </ol>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">MRR</div>
                <div className="text-2xl font-bold">${mrr.toLocaleString()}</div>
                <div className="text-xs opacity-75 mt-1">Monthly Recurring Revenue</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Active Subscriptions</div>
                <div className="text-2xl font-bold">{activeSubscriptions}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Total Subscriptions</div>
                <div className="text-2xl font-bold">{totalSubscriptions}</div>
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            {monthlyData.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
                <div className="space-y-3">
                  {monthlyData.map((data, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="font-medium text-gray-700">{data.month}</span>
                        <span className="text-gray-600">
                          ${data.revenue.toLocaleString()} ({data.count} subscriptions)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 flex items-center px-3 text-white text-sm font-bold"
                          style={{ width: `${(data.revenue / maxRevenue) * 100}%`, minWidth: data.revenue > 0 ? '60px' : '0' }}
                        >
                          {data.revenue > 0 && `$${data.revenue.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-2">💡 Insights</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Total revenue generated: <strong>${totalRevenue.toLocaleString()}</strong></li>
                <li>• Monthly recurring revenue (MRR): <strong>${mrr.toLocaleString()}</strong></li>
                <li>• Active subscriptions: <strong>{activeSubscriptions}</strong> out of {totalSubscriptions} total</li>
                <li>• Average revenue per subscription: <strong>${totalSubscriptions > 0 ? Math.round(totalRevenue / totalSubscriptions).toLocaleString() : '0'}</strong></li>
              </ul>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
