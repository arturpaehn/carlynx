'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface ImportLog {
  id: string
  import_date: string
  dealers_processed: number
  dealers_created: number
  listings_inserted: number
  listings_updated: number
  total_rows: number
  errors: string[]
  duration_ms: number
  status: 'success' | 'partial' | 'failed'
  created_at: string
}

export default function DealerCenterLogsPage() {
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null)

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dealercenter_import_logs')
        .select('*')
        .order('import_date', { ascending: false })
        .limit(50)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  function getStatusColor(status: string) {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return '✅'
      case 'partial':
        return '⚠️'
      case 'failed':
        return '🚨'
      default:
        return '❓'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">DealerCenter Import Logs</h1>
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
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

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">DealerCenter Import Logs</h1>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Total Imports</div>
            <div className="text-2xl font-bold">{logs.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {logs.length > 0
                ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)
                : 0}%
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Last Import</div>
            <div className="text-sm font-bold">
              {logs[0] ? new Date(logs[0].import_date).toLocaleString() : 'N/A'}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Failed Imports</div>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.status === 'failed').length}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rows</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)} {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.import_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.dealers_processed}
                    {log.dealers_created > 0 && (
                      <span className="ml-1 text-green-600">(+{log.dealers_created})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">+{log.listings_inserted}</span>
                      <span className="text-blue-600">~{log.listings_updated}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.total_rows}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(log.duration_ms / 1000).toFixed(2)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.errors.length > 0 ? (
                      <span className="text-red-600 font-medium">{log.errors.length}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No import logs found. Logs will appear here after the first CSV import.
            </div>
          )}
        </div>

        {/* Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">Import Details</h2>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Status</div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLog.status)}`}>
                        {getStatusIcon(selectedLog.status)} {selectedLog.status}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Import Date</div>
                      <div className="font-medium">{new Date(selectedLog.import_date).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Rows</div>
                      <div className="font-medium">{selectedLog.total_rows}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-medium">{(selectedLog.duration_ms / 1000).toFixed(2)}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Dealers Processed</div>
                      <div className="font-medium">{selectedLog.dealers_processed}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">New Dealers</div>
                      <div className="font-medium text-green-600">{selectedLog.dealers_created}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Listings Inserted</div>
                      <div className="font-medium text-green-600">+{selectedLog.listings_inserted}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Listings Updated</div>
                      <div className="font-medium text-blue-600">~{selectedLog.listings_updated}</div>
                    </div>
                  </div>

                  {selectedLog.errors.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2 font-medium">Errors ({selectedLog.errors.length})</div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        {selectedLog.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-800 mb-2 font-mono">
                            {index + 1}. {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
