
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kjntriyhqpfxqciaxbpj.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'nusnffvsnhmqxoeqjhjs.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'content.homenetiol.com',
      },
    ],
  },
  // Умное кеширование: статика кешируется, динамика обновляется
  async headers() {
    return [
      // Статические ресурсы - агрессивное кеширование (1 год)
      {
        source: '/locales/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 1 день
          },
        ],
      },
      // HTML страницы - полный запрет кеширования
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
  // другие опции, если появятся
};

export default nextConfig;
