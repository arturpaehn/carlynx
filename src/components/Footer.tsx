
"use client";

import Image from 'next/image'
import Link from 'next/link'
import ActiveListingsCount from './ActiveListingsCount';
import { useTranslation } from './I18nProvider';

export default function Footer() {
  const { t } = useTranslation()
  
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
            <p className="mb-1">{t('contactUs')}</p>
            <p className="underline">support@carlynx.us</p>
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
              <p>&copy; {new Date().getFullYear()} CarLynx. {t('allRightsReserved')}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
