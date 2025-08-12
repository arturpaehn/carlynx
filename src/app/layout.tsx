import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import SupabaseProvider from '@/components/SupabaseProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CarLynx',
  description: 'Buy & sell used cars in your area.',
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Используем usePathname для определения текущего пути
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pt-[224px] min-h-screen bg-[#ffe6cc]`}>
        <SupabaseProvider>
          <Header />
          {children}
          <Footer />
        </SupabaseProvider>
      </body>
    </html>
  )
}
