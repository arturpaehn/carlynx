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

    // Car brands (for potential brand pages)
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
          priority: 0.5,
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
          priority: 0.5,
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
