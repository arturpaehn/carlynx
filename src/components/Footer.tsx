
"use client";

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ActiveListingsCount from './ActiveListingsCount';
import SupportModal from './SupportModal';
import { useTranslation } from './I18nProvider';

export default function Footer() {
  const { t } = useTranslation()
  
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState(2025);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  if (!mounted) {
    return (
      <footer className="bg-[#4b0082] text-white mt-10">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </footer>
    );
  }
  
  return (
    <footer className="bg-[#4b0082] text-white mt-10">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          {/* Левая часть: лого и текст */}
          <div className="flex items-center gap-4 mb-6 lg:mb-0">
            <Image
              src="/logo2.png"
              alt="CarLynx Logo"
              width={120}
              height={120}
              className="rounded"
              priority
              style={{ width: 'auto', height: 'auto' }}
            />
            <div>
              <h2 className="text-2xl font-bold">CarLynx</h2>
              <p className="text-sm text-gray-200">{t('connectingCarOwners')}</p>
              {/* Счётчик активных объявлений */}
              <div className="mt-2 flex justify-start">
                <ActiveListingsCount />
              </div>
            </div>
          </div>

          {/* Правая часть: контакты */}
          <div className="text-sm text-center lg:text-right">
            <p className="mb-2 text-gray-200">{t('contactUs')}</p>
            <a 
              href="mailto:support@carlynx.us" 
              className="underline hover:text-orange-300 transition-colors block mb-3"
            >
              support@carlynx.us
            </a>
            <button
              onClick={() => setShowSupportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {t('contactSupport')}
            </button>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-purple-400/30 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-sm">
              <Link href="/terms" className="text-gray-200 hover:text-white transition-colors underline">
                {t('termsOfService')}
              </Link>
              <Link href="/privacy" className="text-gray-200 hover:text-white transition-colors underline">
                {t('privacyPolicy')}
              </Link>
              <Link href="/refunds" className="text-gray-200 hover:text-white transition-colors underline">
                {t('refundPolicy')}
              </Link>
              <Link href="/cookies" className="text-gray-200 hover:text-white transition-colors underline">
                {t('cookiesPolicy')}
              </Link>
            </div>
            
            <div className="text-xs text-gray-300 text-center sm:text-right">
              <p>&copy; {currentYear} CarLynx. {t('allRightsReserved')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal open={showSupportModal} onClose={() => setShowSupportModal(false)} />
    </footer>
  )
}
