'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');

  async function exportToCSV(type: 'listings' | 'users' | 'external' | 'all') {
    setExporting(true);
    setProgress('Fetching data...');

    try {
      let csvContent = '';
      let filename = '';

      if (type === 'listings' || type === 'all') {
        setProgress('Exporting regular listings...');
        const { data: listings } = await supabase
          .from('listings')
          .select('*');

        if (listings && listings.length > 0) {
          const headers = Object.keys(listings[0]).join(',');
          const rows = listings.map(listing =>
            Object.values(listing).map(val =>
              typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
          ).join('\n');
          csvContent += `REGULAR LISTINGS\n${headers}\n${rows}\n\n`;
        }
      }

      if (type === 'external' || type === 'all') {
        setProgress('Exporting external listings...');
        const { data: external } = await supabase
          .from('external_listings')
          .select('*');

        if (external && external.length > 0) {
          const headers = Object.keys(external[0]).join(',');
          const rows = external.map(listing =>
            Object.values(listing).map(val =>
              typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
          ).join('\n');
          csvContent += `EXTERNAL LISTINGS\n${headers}\n${rows}\n\n`;
        }
      }

      if (type === 'users' || type === 'all') {
        setProgress('Exporting users...');
        const { data: users } = await supabase
          .from('user_profiles')
          .select('*');

        if (users && users.length > 0) {
          const headers = Object.keys(users[0]).join(',');
          const rows = users.map(user =>
            Object.values(user).map(val =>
              typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
          ).join('\n');
          csvContent += `USERS\n${headers}\n${rows}\n\n`;
        }
      }

      setProgress('Generating file...');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      filename = `carlynx_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgress(`✅ Successfully exported to ${filename}`);
    } catch (error) {
      setProgress(`❌ Error: ${error}`);
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  }

  return (
    <AdminLayout title="Export Data">
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
          <span className="mr-2">📥</span> Export Data to CSV
        </h1>
        <p className="text-gray-600 mb-6">
          Download your data as CSV files for backup or analysis in Excel/Google Sheets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => exportToCSV('listings')}
            disabled={exporting}
            className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-4xl mb-2">📋</div>
            <div className="text-xl font-bold">Regular Listings</div>
            <div className="text-sm opacity-90">Export all user-created listings</div>
          </button>

          <button
            onClick={() => exportToCSV('external')}
            disabled={exporting}
            className="p-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-4xl mb-2">🔗</div>
            <div className="text-xl font-bold">External Listings</div>
            <div className="text-sm opacity-90">Export DealerCenter listings</div>
          </button>

          <button
            onClick={() => exportToCSV('users')}
            disabled={exporting}
            className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-4xl mb-2">👥</div>
            <div className="text-xl font-bold">Users</div>
            <div className="text-sm opacity-90">Export all user profiles</div>
          </button>

          <button
            onClick={() => exportToCSV('all')}
            disabled={exporting}
            className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-4xl mb-2">📦</div>
            <div className="text-xl font-bold">Everything</div>
            <div className="text-sm opacity-90">Export all data in one file</div>
          </button>
        </div>

        {progress && (
          <div className={`p-4 rounded-lg ${progress.includes('Error') ? 'bg-red-100 text-red-700' : progress.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {exporting && !progress.includes('✅') && !progress.includes('❌') && (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            )}
            {progress}
          </div>
        )}

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> CSV files can be opened in Excel, Google Sheets, or any text editor. Use them for backup, analysis, or data migration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
