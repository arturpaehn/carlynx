'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabaseClient';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useUser(); // Initialize user session
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your payment...');
  
  const verifyPaymentAndCreateListing = useCallback(async (sessionId: string) => {
    try {
      // Step 1: Verify payment with Stripe
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const { paymentIntentId, metadata } = await response.json();
      const listingId = metadata?.listingId;

      if (!listingId) {
        throw new Error('Listing ID not found in payment metadata');
      }

      setMessage('Activating your listing...');

      // Step 2: Update payment record to 'paid' status
      const { error: paymentUpdateError } = await supabase
        .from('individual_payments')
        .update({
          payment_status: 'paid',
          stripe_payment_intent_id: paymentIntentId,
          stripe_session_id: sessionId,
          paid_at: new Date().toISOString(),
        })
        .eq('listing_id', listingId);

      if (paymentUpdateError) {
        console.error('Failed to update payment:', paymentUpdateError);
      }

      // Step 3: Activate the listing (set is_active=true and payment_status='paid')
      const { error: listingUpdateError } = await supabase
        .from('listings')
        .update({
          is_active: true,
          payment_status: 'paid',
        })
        .eq('id', listingId);

      if (listingUpdateError) {
        throw new Error('Failed to activate listing: ' + listingUpdateError.message);
      }

      setStatus('success');
      setMessage('Payment successful! Your listing is now live.');
      setTimeout(() => router.push('/my-listings'), 3000);

    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('error');
      setMessage('Payment verification failed. Please contact support.');
    }
  }, [router]);

  useEffect(() => {
    if (!searchParams) {
      setStatus('error');
      setMessage('Invalid page state');
      return;
    }
    
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID found');
      return;
    }

    verifyPaymentAndCreateListing(sessionId);
  }, [searchParams, verifyPaymentAndCreateListing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="text-sm text-gray-500">
              <p>✓ Payment processed</p>
              <p>✓ Listing activated</p>
              <p>✓ Active for 30 days</p>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/add-listing')}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
