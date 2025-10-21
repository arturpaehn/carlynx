
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ПОЛНОЕ ОТКЛЮЧЕНИЕ КЕШИРОВАНИЯ
  webpack: (config) => {
    // Отключаем webpack кеш
    config.cache = false;
    
    // Отключаем все виды оптимизации кеширования
    if (config.optimization) {
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
      config.optimization.runtimeChunk = false;
      config.optimization.splitChunks = false;
    }
    
    // Отключаем кеш модулей
    config.module.unsafeCache = false;
    
    // Отключаем кеш резолвера
    if (config.resolve) {
      config.resolve.unsafeCache = false;
      config.resolve.cache = false;
    }
    
    return config;
  },
  
  // Отключаем build ID кеширование
  generateBuildId: () => {
    return 'no-cache-' + Date.now();
  },
  
  // Изображения
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
  
  // Minimal caching disable - only for API routes
  async headers() {
    return [
      // Only API without cache - let Next.js handle the rest
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
