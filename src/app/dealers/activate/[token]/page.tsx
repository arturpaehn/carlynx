'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface DealerInfo {
  dealer_name: string
  contact_email: string
  subscription_status: string
  tier_id: number | null
}

interface SubscriptionTier {
  id: number
  tier_name: string
  price: number
  max_listings: number
  description: string
  stripe_price_id: string | null
}

export default function ActivateDealerPage() {
  const params = useParams()
  const token = (params?.token as string) || ''

  const [dealer, setDealer] = useState<DealerInfo | null>(null)
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const fetchDealerInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/dealercenter/status/${token}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dealer information')
      }

      setDealer(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dealer')
    }
  }, [token])

  const fetchTiers = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription-tiers')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error('Failed to load subscription tiers')
      }

      setTiers(data.tiers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tiers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchDealerInfo()
      fetchTiers()
    }
  }, [token, fetchDealerInfo, fetchTiers])

  async function handleActivate() {
    if (!selectedTier) {
      setError('Please select a subscription tier')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/dealercenter/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activation_token: token,
          tier_id: selectedTier
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate subscription')
      }

      // Redirect to Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dealer information...</p>
        </div>
      </div>
    )
  }

  if (error && !dealer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Activation Link</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (dealer?.subscription_status === 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Active</h1>
            <p className="text-gray-600 mb-2">
              Your subscription is already active.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Dealer: <strong>{dealer.dealer_name}</strong>
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Activate Your Dealer Subscription
          </h1>
          <p className="text-gray-600">
            Welcome, <strong>{dealer?.dealer_name}</strong>!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Choose a subscription plan to start listing your vehicles
          </p>
        </div>

        {/* Free Trial Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="text-blue-500 text-2xl mr-3">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Free Trial Active</h3>
              <p className="text-sm text-blue-800">
                You currently have <strong>5 free listings</strong> available. 
                Subscribe to unlock your full listing capacity and keep your vehicles visible.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Subscription Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`
                bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all
                ${selectedTier === tier.id 
                  ? 'ring-2 ring-blue-600 transform scale-105' 
                  : 'hover:shadow-xl hover:scale-102'
                }
              `}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tier.tier_name}
                </h3>
                
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  ${tier.price}
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                
                <div className="text-lg text-gray-700 mb-4">
                  Up to <strong>{tier.max_listings}</strong> listings
                </div>

                {tier.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {tier.description}
                  </p>
                )}

                {selectedTier === tier.id && (
                  <div className="mt-4 text-blue-600 font-semibold">
                    ✓ Selected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Activate Button */}
        <div className="text-center">
          <button
            onClick={handleActivate}
            disabled={!selectedTier || processing}
            className={`
              px-8 py-4 rounded-lg font-semibold text-lg transition-all
              ${!selectedTier || processing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
              }
            `}
          >
            {processing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Proceed to Payment'
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            You will be redirected to Stripe for secure payment processing
          </p>
        </div>

        {/* Support */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Need help? Contact us at <a href="mailto:support@carlynx.com" className="text-blue-600 hover:underline">support@carlynx.com</a></p>
        </div>
      </div>
    </div>
  )
}
