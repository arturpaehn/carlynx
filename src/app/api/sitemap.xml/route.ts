import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface Listing {
  id: number;
  updated_at: string;
}

interface ExternalListing {
  id: number;
  updated_at: string;
}

export async function GET() {
  try {
    const baseUrl = 'https://carlynx.us';
    
    // Fetch all active user listings
    const { data: userListings, error: userError } = await supabase
      .from('listings')
      .select('id, updated_at')
      .order('updated_at', { ascending: false });

    if (userError) {
      console.error('Error fetching user listings:', userError);
    }

    // Fetch all external listings (from parsers)
    const { data: externalListings, error: externalError } = await supabase
      .from('external_listings')
      .select('id, updated_at')
      .order('updated_at', { ascending: false });

    if (externalError) {
      console.error('Error fetching external listings:', externalError);
    }

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Add search page
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/search</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';

    // Add user listings
    if (userListings && userListings.length > 0) {
      userListings.forEach((listing: Listing) => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/listing/${listing.id}</loc>\n`;
        xml += `    <lastmod>${new Date(listing.updated_at).toISOString()}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });
    }

    // Add external listings
    if (externalListings && externalListings.length > 0) {
      externalListings.forEach((listing: ExternalListing) => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/listing/external-${listing.id}</loc>\n`;
        xml += `    <lastmod>${new Date(listing.updated_at).toISOString()}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
