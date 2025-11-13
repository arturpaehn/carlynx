'use client'

import { useState, useEffect } from 'react'
import { fetchSafetyRating, calculateAverageRating, renderStars, SafetyRating } from '@/utils/safetyRatings'
import { useTranslation } from '@/components/I18nProvider'

interface SafetyRatingBadgeProps {
  year: number
  brand: string | null
  model: string | null
  className?: string
  compact?: boolean // For small cards on home page
}

export default function SafetyRatingBadge({ 
  year, 
  brand, 
  model, 
  className = '',
  compact = false 
}: SafetyRatingBadgeProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState<SafetyRating | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const loadRating = async () => {
      setLoading(true)
      const safetyRating = await fetchSafetyRating(year, brand, model)
      setRating(safetyRating)
      setLoading(false)
    }

    loadRating()
  }, [year, brand, model])

  // Don't show anything if loading or no rating available
  if (loading) {
    return null // Could add a skeleton loader if desired
  }

  if (!rating || rating.overallRating === null) {
    return null // No rating available for this vehicle
  }

  const avgRating = calculateAverageRating(rating) || rating.overallRating
  const stars = renderStars(avgRating)

  // Compact version for home page cards
  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-xs ${className}`}>
        <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{avgRating}/5</span>
        </div>
      </div>
    )
  }

  // Full version for listing detail page
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 ${className}`}>
      {/* Header with overall rating */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="text-sm font-semibold text-gray-700">NHTSA {t('safetyRating')}</div>
            <div className="text-xs text-gray-500">National Highway Traffic Safety Admin</div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-700 transition-colors"
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
        >
          <svg 
            className={`h-5 w-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Overall rating display */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl font-bold text-blue-600">
          {avgRating}/5
        </div>
        <div className="text-2xl">
          {stars}
        </div>
      </div>

      {/* Expandable detailed ratings */}
      {expanded && (
        <div className="space-y-2 pt-3 border-t border-blue-200 animate-fadeIn">
          <div className="text-xs font-semibold text-gray-600 mb-2">{t('detailedRatings')}:</div>
          
          {rating.overallFrontCrashRating !== null && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-gray-700">{t('frontCrash')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{rating.overallFrontCrashRating}/5</span>
                <span>{renderStars(rating.overallFrontCrashRating)}</span>
              </div>
            </div>
          )}

          {rating.overallSideCrashRating !== null && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="text-gray-700">{t('sideCrash')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{rating.overallSideCrashRating}/5</span>
                <span>{renderStars(rating.overallSideCrashRating)}</span>
              </div>
            </div>
          )}

          {rating.rolloverRating !== null && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-gray-700">{t('rollover')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{rating.rolloverRating}/5</span>
                <span>{renderStars(rating.rolloverRating)}</span>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-blue-100">
            {t('safetyRatingDisclaimer')}
          </div>
        </div>
      )}
    </div>
  )
}
