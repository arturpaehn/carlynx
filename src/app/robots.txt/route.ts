export function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

# Allow all static assets
Allow: /public/
Allow: /_next/static/

# Disallow private/admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /add-listing
Disallow: /edit-listing/
Disallow: /my-listings
Disallow: /profile
Disallow: /login
Disallow: /register
Disallow: /confirm
Disallow: /forgot-password
Disallow: /update-password

# Allow search results and public pages
Allow: /search-results
Allow: /info/
Allow: /listing/
Allow: /browse/
Allow: /location/
Allow: /dealers

# Sitemap
Sitemap: https://carlynx.us/sitemap.xml

# Host (main domain)
Host: https://carlynx.us
`.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
