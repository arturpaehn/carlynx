interface ListingSEO {
  id: string;
  title: string;
  model?: string;
  year?: number;
  price: number;
  description?: string;
  state?: {
    name: string;
    code: string;
    country_code: string;
  } | null;
  image_url?: string;
  vehicle_type?: string;
  brand_name?: string;
  transmission?: string;
  fuel_type?: string;
  engine_size?: number;
}

export function generateListingTitle(listing: ListingSEO): string {
  const brandName = listing.brand_name;
  const vehicleType = listing.vehicle_type || 'Vehicle';
  const locationStr = listing.state ? ` in ${listing.state.name}` : '';
  
  let title = listing.title;
  if (brandName && !title.toLowerCase().includes(brandName.toLowerCase())) {
    title = `${brandName} ${title}`;
  }
  title = `${title} - ${listing.year} ${vehicleType}${locationStr}`;
  
  return title;
}

export function generateListingDescription(listing: ListingSEO): string {
  const specs = [
    listing.year?.toString(),
    listing.brand_name,
    listing.model,
    listing.transmission,
    listing.fuel_type,
    listing.engine_size ? `${listing.engine_size}L` : null,
  ].filter(Boolean).join(' ');
  
  const locationStr = listing.state ? ` in ${listing.state.name}` : '';
  
  if (listing.description && listing.description.length > 20) {
    return `${listing.description.slice(0, 120)}... | ${specs} | $${listing.price.toLocaleString()}${locationStr} | CarLynx`;
  }
  
  return `${specs} for sale for $${listing.price.toLocaleString()}${locationStr}. Contact seller for details. Find more cars and motorcycles on CarLynx.`;
}

export function generateListingKeywords(listing: ListingSEO): string[] {
  return [
    listing.brand_name,
    listing.model,
    listing.year?.toString(),
    listing.vehicle_type?.toLowerCase(),
    listing.transmission,
    listing.fuel_type,
    'used car',
    'for sale',
    listing.state?.name || 'car marketplace',
  ].filter(Boolean) as string[];
}

export function updateMetaTags(title: string, description: string, keywords: string[], imageUrl?: string, canonicalUrl?: string) {
  // Update title
  if (typeof document !== 'undefined') {
    document.title = title;
    
    // Update or create meta tags
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('twitter:')) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords.join(', '));
    
    // Open Graph
    updateMeta('og:title', title);
    updateMeta('og:description', description);
    updateMeta('og:type', 'article');
    if (imageUrl) {
      updateMeta('og:image', imageUrl);
    }
    if (canonicalUrl) {
      updateMeta('og:url', canonicalUrl);
    }
    
    // Twitter
    updateMeta('twitter:title', title.slice(0, 70));
    updateMeta('twitter:description', description);
    updateMeta('twitter:card', 'summary_large_image');
    if (imageUrl) {
      updateMeta('twitter:image', imageUrl);
    }
    
    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    }
  }
}
