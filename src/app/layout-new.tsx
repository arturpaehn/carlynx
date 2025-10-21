import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import SupabaseProvider from '@/components/SupabaseProvider'
import { I18nProvider } from '@/components/I18nProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'
import MonitoringStatus from '@/components/MonitoringStatus'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | CarLynx',
    default: 'CarLynx - Buy & Sell Used Cars and Motorcycles',
  },
  description: 'CarLynx is your trusted marketplace for buying and selling used cars and motorcycles across Texas and nearby states. Find great deals on vehicles or sell your car quickly and safely.',
  keywords: ['used cars', 'motorcycles', 'buy car', 'sell car', 'Texas cars', 'car marketplace', 'vehicle listing', 'automotive'],
  authors: [{ name: 'CarLynx' }],
  creator: 'CarLynx',
  publisher: 'CarLynx',
  other: {
    'cache-control': 'no-cache, no-store, must-revalidate, private',
    'pragma': 'no-cache',
    'expires': '0',
    'last-modified': new Date().toUTCString(),
    'etag': '"' + Date.now() + '"',
    'google-site-verification': 'your-google-verification-code',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://carlynx.us',
    siteName: 'CarLynx',
    title: 'CarLynx - Buy & Sell Used Cars and Motorcycles',
    description: 'Your trusted marketplace for buying and selling used cars and motorcycles across Texas and nearby states.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CarLynx - Used Cars Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarLynx - Buy & Sell Used Cars and Motorcycles',
    description: 'Your trusted marketplace for buying and selling used cars and motorcycles across Texas.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://carlynx.us',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, private" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="build-time" content={Date.now().toString()} />
      </head>
      <body className={geistSans.variable + ' ' + geistMono.variable + ' antialiased pt-[224px] min-h-screen bg-[#ffe6cc]'}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17529094861"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {'window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag("js", new Date()); gtag("config", "AW-17529094861");'}
        </Script>
        
        <SupabaseProvider>
          <I18nProvider>
            <Header />
            {children}
            <Footer />
            <CookieConsent />
            <MonitoringStatus />
          </I18nProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}