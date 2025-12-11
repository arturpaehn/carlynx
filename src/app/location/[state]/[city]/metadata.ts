import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  params: { state: string; city: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateName = params.state ? decodeURIComponent(params.state).toLowerCase() : '';
  const cityName = params.city ? decodeURIComponent(params.city).toLowerCase() : '';
  
  const cityDisplay = cityName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateDisplay = stateName.toUpperCase();

  try {
    // Get state info
    const { data: state } = await supabase
      .from('states')
      .select('id, name, code')
      .or(`code.ilike.${stateName},name.ilike.${stateName}`)
      .single();

    if (!state) {
      return {
        title: `${cityDisplay}, ${stateDisplay} | CarLynx`,
        description: `Find used cars and motorcycles for sale in ${cityDisplay}, ${stateDisplay}.`,
      };
    }

    // Count listings from both tables
    const cityPattern = cityName.replace(/-/g, ' ');
    
    const [{ count: ownCount }, { count: externalCount }] = await Promise.all([
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('state_id', state.id)
        .ilike('city_name', `%${cityPattern}%`),
      supabase
        .from('external_listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('state_id', state.id)
        .ilike('city_name', `%${cityPattern}%`)
    ]);

    const totalCount = (ownCount || 0) + (externalCount || 0);
    const stateFull = state.name || stateDisplay;

    const title = `${cityDisplay}, ${stateFull} Used Cars for Sale | ${totalCount} Listings | CarLynx`;
    const description = `Find ${totalCount} used cars, trucks, SUVs, and motorcycles for sale in ${cityDisplay}, ${stateFull}. Browse listings from local sellers and trusted dealers on CarLynx.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://carlynx.com/location/${stateName}/${cityName}`,
        siteName: 'CarLynx',
        images: [
          {
            url: '/opengraph-image.png',
            width: 1200,
            height: 630,
            alt: `Used cars in ${cityDisplay}, ${stateFull}`,
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
        canonical: `https://carlynx.com/location/${stateName}/${cityName}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for city page:', error);
    return {
      title: `${cityDisplay}, ${stateDisplay} | CarLynx`,
      description: `Find used cars and motorcycles for sale in ${cityDisplay}, ${stateDisplay}.`,
    };
  }
}
