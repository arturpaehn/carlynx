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
  engine_size?: string;
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
  const priceStr = listing.price ? `$${listing.price.toLocaleString()}` : 'Price available upon request';
  
  if (listing.description && listing.description.length > 20) {
    return `${listing.description.slice(0, 120)}... | ${specs} | ${priceStr}${locationStr} | CarLynx`;
  }
  
  return `${specs} for sale for ${priceStr}${locationStr}. Contact seller for details. Find more cars and motorcycles on CarLynx.`;
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

/**
 * Generate Schema.org structured data (JSON-LD) for a vehicle listing
 * This helps search engines understand and display rich snippets
 */
export function generateVehicleStructuredData(listing: ListingSEO): object {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://carlynx.us';
  const listingUrl = `${baseUrl}/listing/${listing.id}`;
  
  // Build structured data object
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description || generateListingDescription(listing),
    url: listingUrl,
    category: listing.vehicle_type === 'motorcycle' ? 'Motorcycles' : 'Automobiles',
  };

  // Add brand if available
  if (listing.brand_name) {
    structuredData.brand = {
      '@type': 'Brand',
      name: listing.brand_name,
    };
  }

  // Add model if available
  if (listing.model) {
    structuredData.model = listing.model;
  }

  // Add year as vehicleModelDate
  if (listing.year) {
    structuredData.vehicleModelDate = listing.year.toString();
  }

  // Add image
  if (listing.image_url) {
    structuredData.image = listing.image_url;
  }

  // Add offer details
  const offerData: Record<string, unknown> = {
    '@type': 'Offer',
    price: listing.price.toString(),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: listingUrl,
  };

  // Add seller location if available
  if (listing.state) {
    offerData.availableAtOrFrom = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressRegion: listing.state.code,
        addressCountry: listing.state.country_code || 'US',
      },
    };
  }

  structuredData.offers = offerData;

  // Add additional vehicle details
  const additionalProperties: Array<Record<string, string>> = [];

  if (listing.transmission) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Transmission',
      value: listing.transmission,
    });
  }

  if (listing.fuel_type) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Fuel Type',
      value: listing.fuel_type,
    });
  }

  if (listing.engine_size) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Engine Size',
      value: listing.vehicle_type === 'motorcycle' 
        ? `${listing.engine_size} cc` 
        : `${(listing.engine_size / 1000).toFixed(1)}L`,
    });
  }

  if (additionalProperties.length > 0) {
    structuredData.additionalProperty = additionalProperties;
  }

  return structuredData;
}

/**
 * Insert structured data script into document head
 */
export function insertStructuredData(data: object) {
  if (typeof document === 'undefined') return;

  // Remove existing structured data if any
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Create and insert new script
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}
