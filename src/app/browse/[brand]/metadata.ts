import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  params: { brand: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brandName = params.brand ? decodeURIComponent(params.brand).toLowerCase() : '';
  const brandDisplay = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  try {
    // Count listings from both tables
    const [{ count: ownCount }, { count: externalCount }] = await Promise.all([
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .ilike('title', `${brandName}%`),
      supabase
        .from('external_listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`brand.ilike.${brandName},title.ilike.${brandName}%`)
    ]);

    const totalCount = (ownCount || 0) + (externalCount || 0);

    const title = `${brandDisplay} Vehicles for Sale | ${totalCount} Listings | CarLynx`;
    const description = `Find ${totalCount} ${brandDisplay} cars, trucks, SUVs, and motorcycles for sale. Browse listings from local sellers and trusted dealers on CarLynx. Best deals updated daily.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://carlynx.com/browse/${encodeURIComponent(brandName)}`,
        siteName: 'CarLynx',
        images: [
          {
            url: '/opengraph-image.png',
            width: 1200,
            height: 630,
            alt: `${brandDisplay} vehicles for sale`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/twitter-image.png'],
      },
      alternates: {
        canonical: `https://carlynx.com/browse/${encodeURIComponent(brandName)}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for brand page:', error);
    return {
      title: `${brandDisplay} Vehicles | CarLynx`,
      description: `Find used ${brandDisplay} vehicles for sale on CarLynx.`,
    };
  }
}
