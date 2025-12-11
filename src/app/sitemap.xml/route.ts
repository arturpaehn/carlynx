import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SitemapUrl {
  url: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

async function generateSitemapUrls(): Promise<SitemapUrl[]> {
  const baseUrl = 'https://carlynx.us';
  const now = new Date().toISOString();
  const urls: SitemapUrl[] = [];

  // Static pages
  urls.push(
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search-results`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    // Legal pages
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refunds`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    }
  );

  try {
    // Active listings
    const { data: listings } = await supabase
      .from('listings')
      .select('id, updated_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10000); // Reasonable limit for sitemap

    if (listings) {
      listings.forEach((listing) => {
        const lastModified = listing.updated_at || listing.created_at || now;
        urls.push({
          url: `${baseUrl}/listing/${listing.id}`,
          lastModified: new Date(lastModified).toISOString(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }

    // Get unique brands from active listings (both tables)
    const { data: ownBrands } = await supabase
      .from('listings')
      .select('title')
      .eq('is_active', true);

    const { data: externalBrands } = await supabase
      .from('external_listings')
      .select('brand, title')
      .eq('is_active', true);

    // Extract unique brand names
    const brandSet = new Set<string>();
    
    // From listings table (brand is first word of title)
    if (ownBrands) {
      ownBrands.forEach((listing) => {
        const brand = listing.title?.split(' ')[0]?.toLowerCase();
        if (brand && brand.length > 1) {
          brandSet.add(brand);
        }
      });
    }

    // From external_listings table
    if (externalBrands) {
      externalBrands.forEach((listing) => {
        const brand = (listing.brand || listing.title?.split(' ')[0])?.toLowerCase();
        if (brand && brand.length > 1) {
          brandSet.add(brand);
        }
      });
    }

    // Add SEO-friendly brand pages (/browse/toyota instead of /search-results?brand=Toyota)
    Array.from(brandSet).forEach((brand) => {
      urls.push({
        url: `${baseUrl}/browse/${encodeURIComponent(brand)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7, // Higher priority for SEO pages
      });
    });

    // Add SEO-friendly city pages from both tables
    const { data: ownCities } = await supabase
      .from('listings')
      .select('city_name, state_id, states!inner(code, name)')
      .eq('is_active', true)
      .not('city_name', 'is', null)
      .not('state_id', 'is', null);

    const { data: externalCities } = await supabase
      .from('external_listings')
      .select('city_name, state_id, states!inner(code, name)')
      .eq('is_active', true)
      .not('city_name', 'is', null)
      .not('state_id', 'is', null);

    // Combine and deduplicate city/state pairs
    const cityMap = new Map<string, { city: string; state: string; stateCode: string }>();
    
    type CityData = {
      city_name: string;
      state_id: number;
      states: { code: string; name: string } | Array<{ code: string; name: string }>;
    };
    
    const processCities = (cityData: CityData[]) => {
      cityData?.forEach((item) => {
        const cityName = item.city_name?.toLowerCase().trim();
        let stateCode = '';
        let stateName = '';
        
        if (item.states) {
          if (Array.isArray(item.states) && item.states.length > 0) {
            stateCode = item.states[0].code?.toLowerCase() || '';
            stateName = item.states[0].name || '';
          } else if (typeof item.states === 'object') {
            stateCode = (item.states as { code: string; name: string }).code?.toLowerCase() || '';
            stateName = (item.states as { code: string; name: string }).name || '';
          }
        }
        
        if (cityName && stateCode && stateName) {
          const key = `${stateCode}-${cityName}`;
          if (!cityMap.has(key)) {
            cityMap.set(key, {
              city: cityName,
              state: stateName,
              stateCode: stateCode
            });
          }
        }
      });
    };

    if (ownCities) processCities(ownCities as CityData[]);
    if (externalCities) processCities(externalCities as CityData[]);

    // Add city pages (limited to keep sitemap manageable)
    Array.from(cityMap.values()).slice(0, 200).forEach(({ city, stateCode }) => {
      const citySlug = city.replace(/\s+/g, '-');
      urls.push({
        url: `${baseUrl}/location/${stateCode}/${citySlug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8, // High priority for local SEO
      });
    });

    // Keep old search URLs for backward compatibility (lower priority)
    const { data: carBrands } = await supabase
      .from('car_brands')
      .select('id, name')
      .order('name');

    if (carBrands) {
      carBrands.forEach((brand) => {
        urls.push({
          url: `${baseUrl}/search-results?brand=${encodeURIComponent(brand.name)}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.4, // Lower priority than SEO pages
        });
      });
    }

    // Motorcycle brands
    const { data: motorcycleBrands } = await supabase
      .from('motorcycle_brands')
      .select('id, name')
      .order('name');

    if (motorcycleBrands) {
      motorcycleBrands.forEach((brand) => {
        urls.push({
          url: `${baseUrl}/search-results?motorcycleBrand=${encodeURIComponent(brand.name)}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.4,
        });
      });
    }

    // States (location-based pages)
    const { data: states } = await supabase
      .from('states')
      .select('id, name, code')
      .order('name');

    if (states) {
      states.forEach((state) => {
        urls.push({
          url: `${baseUrl}/search-results?state=${encodeURIComponent(state.name)}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      });
    }

    // Cities (top cities only to avoid too large sitemap)
    const { data: cities } = await supabase
      .from('cities')
      .select('id, name')
      .order('name')
      .limit(100); // Top 100 cities to keep sitemap manageable

    if (cities) {
      cities.forEach((city) => {
        urls.push({
          url: `${baseUrl}/search-results?city=${encodeURIComponent(city.name)}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.4,
        });
      });
    }

  } catch (error) {
    console.error('Error generating sitemap urls:', error);
    // Return at least static pages if DB fails
  }

  return urls;
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlsXml = urls
    .map(
      (url) => `
  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastModified}</lastmod>
    <changefreq>${url.changeFrequency}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

export async function GET() {
  try {
    const urls = await generateSitemapUrls();
    const sitemap = generateSitemapXml(urls);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Fallback minimal sitemap
    const fallbackSitemap = generateSitemapXml([
      {
        url: 'https://carlynx.us/',
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ]);

    return new Response(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
