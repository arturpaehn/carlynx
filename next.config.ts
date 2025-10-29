
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
      {
        protocol: 'https',
        hostname: 'www.autocenteroftexas.com',
      },
      {
        protocol: 'https',
        hostname: 'imageserver.promaxinventory.com',
      },
      {
        protocol: 'https',
        hostname: 'www.preownedplus.com',
      },
      {
        protocol: 'https',
        hostname: 'www.iwanttobuyused.com',
      },
    ],
  },
};

export default nextConfig;
