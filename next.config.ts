
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Images configuration
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
};

export default nextConfig;
