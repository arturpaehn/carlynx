
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
    ],
  },
  // другие опции, если появятся
};

export default nextConfig;
