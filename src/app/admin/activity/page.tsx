'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

type HeatmapData = number[][];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmapPage() {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>([]);
  const [maxValue, setMaxValue] = useState(0);
  const [totalListings, setTotalListings] = useState(0);
  const [peakTime, setPeakTime] = useState({ day: '', hour: 0, count: 0 });

  useEffect(() => {
    fetchActivityData();
  }, []);

  async function fetchActivityData() {
    setLoading(true);
    try {
      // Fetch all listings with created_at
      const { data: regularListings } = await supabase
        .from('listings')
        .select('created_at');

      const { data: externalListings } = await supabase
        .from('external_listings')
        .select('created_at');

      const allCreatedDates = [
        ...(regularListings || []).map((l: { created_at: string }) => new Date(l.created_at)),
        ...(externalListings || []).map((l: { created_at: string }) => new Date(l.created_at))
      ];

      setTotalListings(allCreatedDates.length);

      // Initialize 7x24 matrix (days x hours)
      const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

      // Populate matrix
      allCreatedDates.forEach(date => {
        const day = date.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = date.getHours(); // 0-23
        matrix[day][hour]++;
      });

      setHeatmapData(matrix);

      // Find max value for color scaling
      const max = Math.max(...matrix.flat());
      setMaxValue(max);

      // Find peak time
      let peakDay = 0;
      let peakHour = 0;
      let peakCount = 0;
      matrix.forEach((dayData, dayIndex) => {
        dayData.forEach((count, hourIndex) => {
          if (count > peakCount) {
            peakCount = count;
            peakDay = dayIndex;
            peakHour = hourIndex;
          }
        });
      });

      setPeakTime({ day: DAYS[peakDay], hour: peakHour, count: peakCount });
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getColorIntensity(value: number): string {
    if (value === 0) return 'bg-gray-100';
    const intensity = Math.min(Math.ceil((value / maxValue) * 5), 5);
    const colors = [
      'bg-blue-100',
      'bg-blue-200',
      'bg-blue-400',
      'bg-blue-600',
      'bg-blue-800'
    ];
    return colors[intensity - 1];
  }

  return (
    <AdminLayout title="Activity Heatmap">
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
          <span className="mr-2">🔥</span> Activity Heatmap
        </h1>
        <p className="text-gray-600 mb-6">
          Visualize when listings are created throughout the week.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Analyzing activity patterns...</p>
          </div>
        ) : heatmapData.length > 0 ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Total Listings Analyzed</div>
                <div className="text-2xl font-bold">{totalListings.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Peak Day</div>
                <div className="text-2xl font-bold">{peakTime.day}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Peak Hour</div>
                <div className="text-2xl font-bold">
                  {peakTime.hour}:00 ({peakTime.count} listings)
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <div className="overflow-x-auto">
              <div className="mb-2 text-sm font-semibold text-gray-700">
                Listing Creation Activity by Day & Hour
              </div>
              <div className="inline-block min-w-full">
                {/* Hour labels */}
                <div className="flex mb-1">
                  <div className="w-24"></div>
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="flex-shrink-0 w-8 text-center text-xs text-gray-600"
                      style={{ fontSize: '10px' }}
                    >
                      {hour}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                {heatmapData.map((dayData, dayIndex) => (
                  <div key={dayIndex} className="flex items-center mb-1">
                    <div className="w-24 text-sm text-gray-700 pr-2 flex-shrink-0">
                      {DAYS[dayIndex]}
                    </div>
                    <div className="flex">
                      {dayData.map((count, hourIndex) => (
                        <div
                          key={hourIndex}
                          className={`flex-shrink-0 w-8 h-8 border border-gray-200 ${getColorIntensity(count)} flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 hover:z-10 cursor-pointer`}
                          title={`${DAYS[dayIndex]} ${hourIndex}:00 - ${count} listings`}
                        >
                          {count > 0 && (
                            <span className={count > maxValue / 2 ? 'text-white' : 'text-gray-700'}>
                              {count}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                <span className="text-gray-600">Less</span>
                <div className="flex gap-1">
                  <div className="w-6 h-6 bg-gray-100 border border-gray-200"></div>
                  <div className="w-6 h-6 bg-blue-100 border border-gray-200"></div>
                  <div className="w-6 h-6 bg-blue-200 border border-gray-200"></div>
                  <div className="w-6 h-6 bg-blue-400 border border-gray-200"></div>
                  <div className="w-6 h-6 bg-blue-600 border border-gray-200"></div>
                  <div className="w-6 h-6 bg-blue-800 border border-gray-200"></div>
                </div>
                <span className="text-gray-600">More</span>
              </div>
            </div>

            {/* Insights */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Insights</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Peak activity occurs on <strong>{peakTime.day}</strong> at <strong>{peakTime.hour}:00</strong> with {peakTime.count} listings created</li>
                <li>• Total of {totalListings.toLocaleString()} listings analyzed across all time periods</li>
                <li>• Darker cells indicate higher activity - use this to optimize marketing timing</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🔥</div>
            <div className="text-lg font-medium">No activity data available</div>
            <div className="text-sm">Create some listings to see the activity pattern</div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
