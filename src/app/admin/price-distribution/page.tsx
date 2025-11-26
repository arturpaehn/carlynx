'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

type PriceBucket = {
  range: string;
  count: number;
  percentage: number;
  color: string;
};

export default function PriceDistributionPage() {
  const [loading, setLoading] = useState(true);
  const [buckets, setBuckets] = useState<PriceBucket[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    avgPrice: 0,
    medianPrice: 0,
    minPrice: 0,
    maxPrice: 0
  });

  useEffect(() => {
    fetchPriceDistribution();
  }, []);

  async function fetchPriceDistribution() {
    setLoading(true);
    try {
      // Fetch all active listings
      const { data: regularListings } = await supabase
        .from('listings')
        .select('price')
        .eq('is_active', true)
        .not('price', 'is', null);

      const { data: externalListings } = await supabase
        .from('external_listings')
        .select('price')
        .eq('is_active', true)
        .not('price', 'is', null);

      const allPrices = [
        ...(regularListings || []).map((l: { price: number }) => l.price),
        ...(externalListings || []).map((l: { price: number }) => l.price)
      ].filter((p: number) => p > 0).sort((a: number, b: number) => a - b);

      if (allPrices.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate statistics
      const total = allPrices.length;
      const sum = allPrices.reduce((acc: number, p: number) => acc + p, 0);
      const avgPrice = Math.round(sum / total);
      const medianPrice = allPrices[Math.floor(total / 2)];
      const minPrice = allPrices[0];
      const maxPrice = allPrices[total - 1];

      setStats({ total, avgPrice, medianPrice, minPrice, maxPrice });

      // Define price buckets
      const bucketRanges = [
        { range: 'Under $5k', min: 0, max: 5000, color: 'bg-blue-500' },
        { range: '$5k - $10k', min: 5000, max: 10000, color: 'bg-green-500' },
        { range: '$10k - $20k', min: 10000, max: 20000, color: 'bg-yellow-500' },
        { range: '$20k - $50k', min: 20000, max: 50000, color: 'bg-orange-500' },
        { range: '$50k - $100k', min: 50000, max: 100000, color: 'bg-red-500' },
        { range: 'Over $100k', min: 100000, max: Infinity, color: 'bg-purple-500' }
      ];

      const distributionBuckets = bucketRanges.map(({ range, min, max, color }) => {
        const count = allPrices.filter((p: number) => p >= min && p < max).length;
        const percentage = (count / total) * 100;
        return { range, count, percentage, color };
      });

      setBuckets(distributionBuckets);
    } catch (error) {
      console.error('Error fetching price distribution:', error);
    } finally {
      setLoading(false);
    }
  }

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <AdminLayout title="Price Distribution">
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
          <span className="mr-2">📊</span> Price Distribution Analysis
        </h1>
        <p className="text-gray-600 mb-6">
          Visualize how listing prices are distributed across different price ranges.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading price data...</p>
          </div>
        ) : buckets.length > 0 ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Total Listings</div>
                <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Average Price</div>
                <div className="text-2xl font-bold">${(stats.avgPrice / 1000).toFixed(0)}k</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Median Price</div>
                <div className="text-2xl font-bold">${(stats.medianPrice / 1000).toFixed(0)}k</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Min Price</div>
                <div className="text-2xl font-bold">${(stats.minPrice / 1000).toFixed(1)}k</div>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Max Price</div>
                <div className="text-2xl font-bold">${(stats.maxPrice / 1000).toFixed(0)}k</div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Distribution Chart</h2>
              <div className="space-y-4">
                {buckets.map((bucket, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="font-medium text-gray-700">{bucket.range}</span>
                      <span className="text-gray-600">
                        {bucket.count} listings ({bucket.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className={`${bucket.color} h-full rounded-full transition-all duration-500 flex items-center px-3 text-white text-sm font-bold`}
                        style={{ width: `${(bucket.count / maxCount) * 100}%`, minWidth: bucket.count > 0 ? '40px' : '0' }}
                      >
                        {bucket.count > 0 && bucket.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Insights</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Most listings fall in the ${buckets.reduce((max, b) => b.count > max.count ? b : max, buckets[0]).range.toLowerCase()} range</li>
                <li>• Average price is ${stats.avgPrice.toLocaleString()}, median is ${stats.medianPrice.toLocaleString()}</li>
                <li>• Price range spans from ${stats.minPrice.toLocaleString()} to ${stats.maxPrice.toLocaleString()}</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">📊</div>
            <div className="text-lg font-medium">No price data available</div>
            <div className="text-sm">Add some active listings to see the distribution</div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
