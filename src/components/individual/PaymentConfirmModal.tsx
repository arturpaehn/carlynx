'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/components/I18nProvider';

// Free trial flag - set to false when Stripe is ready
const IS_FREE_TRIAL = false;

interface ListingDetails {
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: string;
  images: File[];
}

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onCreatePendingListing?: () => Promise<string>; // Returns listing_id for paid flow
  listingDetails: ListingDetails;
  userId: string;
  userEmail?: string;
}

const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCreatePendingListing,
  listingDetails,
  userId,
  userEmail,
}) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (IS_FREE_TRIAL) {
        // Free trial: create listing directly with free_trial status
        await onConfirm();
        onClose();
      } else {
        // Paid flow: create pending listing first, then redirect to Stripe
        if (!onCreatePendingListing) {
          throw new Error('onCreatePendingListing is required for paid flow');
        }
        
        // Step 1: Create listing with status=pending and is_active=false
        const listingId = await onCreatePendingListing();
        
        // Step 2: Create Stripe checkout session with listing_id in metadata
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingTitle: listingDetails.title,
            amount: LISTING_PRICE * 100, // Convert to cents (500 = $5)
            userId: userId,
            userEmail: userEmail,
            listingId: listingId, // Pass listing_id to track in payment-success
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Step 3: Redirect to Stripe Checkout
        // Payment-success page will activate the listing after successful payment
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error confirming listing:', error);
      alert(t('errorCreatingListing'));
      setIsProcessing(false);
    }
  };

  const LISTING_PRICE = 5; // USD per listing

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {IS_FREE_TRIAL ? t('confirmListingFree') : t('confirmListingPayment')}
            </h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label={t('close')}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Free Trial Banner */}
          {IS_FREE_TRIAL && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-1">
                    {t('limitedTimeOffer')}
                  </h3>
                  <p className="text-green-800">{t('freeTrialDescription')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Listing Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('listingTitle')}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('title')}:</span>
                <span className="font-medium text-gray-900">{listingDetails.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('vehicle')}:</span>
                <span className="font-medium text-gray-900">
                  {listingDetails.year} {listingDetails.make} {listingDetails.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('vehiclePrice')}:</span>
                <span className="font-medium text-gray-900">
                  ${listingDetails.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('mileage')}:</span>
                <span className="font-medium text-gray-900">{listingDetails.mileage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('images')}:</span>
                <span className="font-medium text-gray-900">
                  {listingDetails.images.length} {t('uploaded')}
                </span>
              </div>
            </div>
          </div>

          {/* Features Included */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('includedFeatures')}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">
                  {IS_FREE_TRIAL
                    ? t('feature30DaysFree')
                    : t('feature30Days')}
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">{t('featureUnlimitedViews')}</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">{t('featureDirectContact')}</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">{t('featureEditAnytime')}</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">{t('featureHighQualityPhotos')}</span>
              </li>
            </ul>
          </div>

          {/* Payment Amount */}
          {!IS_FREE_TRIAL && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">{t('total')}:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${LISTING_PRICE} USD
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{t('oneTimePayment')}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                IS_FREE_TRIAL
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('processing')}
                </span>
              ) : IS_FREE_TRIAL ? (
                t('addForFree')
              ) : (
                t('proceedToPayment')
              )}
            </button>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {t('byConfirmingYouAgree')}{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              {t('termsOfService')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmModal;
