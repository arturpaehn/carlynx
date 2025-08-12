import type { NextConfig } from 'next';
import { i18n } from './next-i18next.config';

const nextConfig: NextConfig = {
  i18n,
  images: {
    domains: [
      'kjntriyhqpfxqciaxbpj.supabase.co',
    ],
  },
  // другие опции, если появятся
};

export default nextConfig;
