'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

export default function CleanupPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ days30: number; days60: number; days90: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    const now = new Date();
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const { data: all } = await supabase
      .from('listings')
      .select('id, is_active, updated_at, created_at');

    if (all) {
      const inactive = all.filter((l: { is_active: boolean }) => !l.is_active);
      const days30 = inactive.filter((l: { updated_at?: string; created_at: string }) => {
        const date = new Date(l.updated_at || l.created_at);
        return date < days30Ago;
      }).length;
      const days60 = inactive.filter((l: { updated_at?: string; created_at: string }) => {
        const date = new Date(l.updated_at || l.created_at);
        return date < days60Ago;
      }).length;
      const days90 = inactive.filter((l: { updated_at?: string; created_at: string }) => {
        const date = new Date(l.updated_at || l.created_at);
        return date < days90Ago;
      }).length;

      setStats({ days30, days60, days90 });
    }
    setLoading(false);
  }

  async function deleteOldListings(days: number) {
    if (!confirm(`Are you sure you want to delete ${days === 30 ? stats?.days30 : days === 60 ? stats?.days60 : stats?.days90} inactive listings older than ${days} days?\n\nThis action CANNOT be undone!`)) {
      return;
    }

    setDeleting(true);
    setResult(null);

    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get listings to delete
      const { data: toDelete } = await supabase
        .from('listings')
        .select('id, updated_at, created_at')
        .eq('is_active', false);

      if (toDelete) {
        const idsToDelete = toDelete
          .filter((l: { updated_at?: string; created_at: string }) => {
            const date = new Date(l.updated_at || l.created_at);
            return date < cutoffDate;
          })
          .map((l: { id: string }) => l.id);

        if (idsToDelete.length > 0) {
          // Delete listing images first
          await supabase
            .from('listing_images')
            .delete()
            .in('listing_id', idsToDelete);

          // Delete listings
          const { error } = await supabase
            .from('listings')
            .delete()
            .in('id', idsToDelete);

          if (error) {
            setResult(`Error: ${error.message}`);
          } else {
            setResult(`✅ Successfully deleted ${idsToDelete.length} listings!`);
            fetchStats(); // Refresh stats
          }
        } else {
          setResult('No listings found to delete.');
        }
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout title="Cleanup Old Listings">
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
          <span className="mr-2">🗑️</span> Delete Old Inactive Listings
        </h1>
        <p className="text-gray-600 mb-6">
          Clean up your database by removing inactive listings that haven&apos;t been updated in a long time.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Inactive 30+ days</div>
                <div className="text-3xl font-bold text-yellow-600">{stats.days30}</div>
                <button
                  onClick={() => deleteOldListings(30)}
                  disabled={deleting || stats.days30 === 0}
                  className="mt-3 w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete These'}
                </button>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Inactive 60+ days</div>
                <div className="text-3xl font-bold text-orange-600">{stats.days60}</div>
                <button
                  onClick={() => deleteOldListings(60)}
                  disabled={deleting || stats.days60 === 0}
                  className="mt-3 w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete These'}
                </button>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Inactive 90+ days</div>
                <div className="text-3xl font-bold text-red-600">{stats.days90}</div>
                <button
                  onClick={() => deleteOldListings(90)}
                  disabled={deleting || stats.days90 === 0}
                  className="mt-3 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete These'}
                </button>
              </div>
            </div>

            {/* Result Message */}
            {result && (
              <div className={`p-4 rounded-lg ${result.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {result}
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> Deletion is permanent and cannot be undone. Make sure you have a backup if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-red-600">
            Failed to load statistics. Please try refreshing the page.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
