import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

function getSupabase(supabaseUrl?: string, supabaseKey?: string) {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!url || !key) {
    throw new Error(`Supabase credentials missing: url=${!!url}, key=${!!key}`);
  }
  
  return createClient(url, key, {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

interface ScrapedListing {
  externalId: string;
  externalUrl: string;  
  title: string;
  description?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  transmission?: string;
  mileage?: number;
  fuelType?: string;
  vehicleType?: string;
  imageUrl?: string;
}

// Fetch and parse Mars Dealership listings from all pages
async function fetchListings(): Promise<ScrapedListing[]> {
  console.log('🔍 Fetching Mars Dealership listings...');
  
  const allListings: ScrapedListing[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    try {
      const url = currentPage === 1 
        ? 'https://marsdealership.com/listings/'
        : `https://marsdealership.com/listings/page/${currentPage}/`;
      
      console.log(`📄 Fetching page ${currentPage}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️ Page ${currentPage} returned status ${response.status}, stopping.`);
        break;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const pageListings: ScrapedListing[] = [];
    
    // Parse each listing card - use 'article' selector to avoid duplicates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $('article.listing-item').each((index: number, element: any) => {
      try {
        const $el = $(element);
        
        // Extract data from the card
        const link = $el.find('a.listing-image').first().attr('href');
        if (!link) return;
        
        const externalUrl = link;
        // Extract ID from URL more reliably
        const urlParts = link.split('/').filter(p => p);
        const externalId = urlParts[urlParts.length - 1] || `listing-${index}`;
        
        // Get title from h2.listing-title or h3.listing-title
        const fullTitle = $el.find('h2.listing-title a, h3.listing-title a').text().trim();
        if (!fullTitle || fullTitle.length < 5) return; // Skip invalid titles
        
        // Extract price from .listing-price .price-text
        const priceText = $el.find('.listing-price .price-text').text().trim();
        const priceMatch = priceText.match(/[\d,]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : undefined;
        
        // Extract year
        const yearMatch = fullTitle.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
        
        // Extract make and model from title
        const titleParts = fullTitle.split(' ');
        const yearIndex = titleParts.findIndex(p => /^\d{4}$/.test(p));
        let make: string | undefined;
        let model: string | undefined;
        
        if (yearIndex >= 0 && titleParts.length > yearIndex + 2) {
          make = titleParts[yearIndex + 1];  // First word after year = Brand
          model = titleParts[yearIndex + 2]; // Second word = Model
        }
        
        // Extract mileage from .listing-meta .value-suffix (odometer icon)
        const mileageText = $el.find('.listing-meta.with-icon .value-suffix').text().trim();
        const mileageMatch = mileageText.match(/[\d,]+/);
        const mileage = mileageMatch ? parseInt(mileageMatch[0].replace(/,/g, '')) : undefined;
        
        // Extract transmission from .listing-meta.transmission
        const transmissionText = $el.find('.listing-meta.transmission').text().toLowerCase();
        let transmission: string | undefined;
        if (transmissionText.includes('automatic') || transmissionText.includes('cvt')) transmission = 'automatic';
        else if (transmissionText.includes('manual')) transmission = 'manual';
        
        // Extract fuel type from .listing-meta (look for fuel-related classes or content)
        const allMetaText = $el.find('.listing-meta').text().toLowerCase();
        let fuelType: string | undefined;
        if (allMetaText.includes('electric') || allMetaText.includes('ev')) fuelType = 'electric';
        else if (allMetaText.includes('hybrid')) fuelType = 'hybrid';
        else if (allMetaText.includes('diesel')) fuelType = 'diesel';
        else if (allMetaText.includes('gasoline') || allMetaText.includes('gas') || allMetaText.includes('petrol')) fuelType = 'gasoline';
        
        // Extract image from .listing-image img
        const img = $el.find('.listing-image img').first();
        let imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://marsdealership.com${imageUrl}`;
        }
        // Skip placeholder images
        if (imageUrl?.includes('placeholder') || imageUrl?.includes('loading')) {
          imageUrl = undefined;
        }
        
        pageListings.push({
          externalId,
          externalUrl,
          title: make || 'Unknown',  // Title = Brand only (e.g., "Ford")
          description: fullTitle,    // Full title for description (e.g., "2018 Ford F150 SuperCrew...")
          make,                      // Brand
          model,                     // Model only
          year,
          price,
          transmission,
          mileage,
          fuelType,
          vehicleType: 'car',
          imageUrl
        });
        
      } catch (err) {
        console.error(`❌ Error parsing listing ${index}:`, err);
      }
    });
    
    console.log(`  ✅ Found ${pageListings.length} listings on page ${currentPage}`);
    
    // If no listings found on this page, stop pagination
    if (pageListings.length === 0) {
      hasMorePages = false;
    } else {
      allListings.push(...pageListings);
      currentPage++;
      
      // Add small delay between requests to be polite
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error(`❌ Error fetching page ${currentPage}:`, error);
    hasMorePages = false;
  }
  }
    
  console.log(`\n✅ Total listings found: ${allListings.length}`);
  return allListings;
}

// Download image and upload to Supabase Storage
async function downloadAndUploadImage(imageUrl: string, externalId: string): Promise<string | null> {
  const supabase = getSupabase();
  try {
    console.log(`📥 Downloading image for ${externalId}...`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Supabase Storage
    const fileName = `${externalId}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('external-listing-images')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Error uploading image for ${externalId}:`, error);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('external-listing-images')
      .getPublicUrl(fileName);
    
    console.log(`✅ Image uploaded for ${externalId}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`❌ Error processing image for ${externalId}:`, error);
    return null;
  }
}

// Get Texas state ID and Dallas city ID
async function getLocationIds(): Promise<{ stateId: number | null; cityId: number | null }> {
  const supabase = getSupabase();
  // Get Texas state ID
  const { data: stateData, error: stateError } = await supabase
    .from('states')
    .select('id')
    .ilike('name', '%texas%')
    .single();
  
  if (stateError) {
    console.error('❌ Error fetching Texas state:', stateError);
    return { stateId: null, cityId: null };
  }
  
  const stateId = stateData?.id || null;
  
  if (!stateId) {
    return { stateId: null, cityId: null };
  }
  
  // Get Dallas city ID
  const { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('state_id', stateId)
    .ilike('name', '%dallas%')
    .single();
  
  if (cityError) {
    console.error('❌ Error fetching Dallas city:', cityError);
    return { stateId, cityId: null };
  }
  
  return { stateId, cityId: cityData?.id || null };
}

// Sync listings to database
async function syncListings(listings: ScrapedListing[]) {
  const supabase = getSupabase();
  console.log(`🔄 Syncing ${listings.length} listings to database...`);
  
  const { stateId: texasStateId, cityId: dallasCityId } = await getLocationIds();
  const currentTime = new Date().toISOString();
  const seenExternalIds = new Set<string>();
  
  for (const listing of listings) {
    try {
      seenExternalIds.add(listing.externalId);
      
      // Check if listing already exists
      const { data: existing } = await supabase
        .from('external_listings')
        .select('id, image_url')
        .eq('external_id', listing.externalId)
        .eq('source', 'mars_dealership')
        .single();
      
      let finalImageUrl = listing.imageUrl;
      
      // Download and upload image if needed
      if (listing.imageUrl && !existing?.image_url) {
        const uploadedUrl = await downloadAndUploadImage(listing.imageUrl, listing.externalId);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      } else if (existing?.image_url) {
        finalImageUrl = existing.image_url;
      }
      
      const listingData = {
        external_id: listing.externalId,
        source: 'mars_dealership',
        external_url: listing.externalUrl,
        title: listing.title,
        description: listing.description,
        brand: listing.make,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        transmission: listing.transmission,
        mileage: listing.mileage,
        fuel_type: listing.fuelType,
        vehicle_type: listing.vehicleType || 'car',
        image_url: finalImageUrl,
        contact_phone: '+1 682 360 3867',
        contact_email: 'marsdealership@gmail.com',
        state_id: texasStateId,
        city_id: dallasCityId,
        city_name: 'Dallas',
        last_seen_at: currentTime,
        is_active: true
      };
      
      if (existing) {
        // Update existing listing
        const { error } = await supabase
          .from('external_listings')
          .update(listingData)
          .eq('id', existing.id);
        
        if (error) {
          console.error(`❌ Error updating listing ${listing.externalId}:`, error);
        } else {
          console.log(`✅ Updated listing: ${listing.title}`);
        }
      } else {
        // Insert new listing
        const { error } = await supabase
          .from('external_listings')
          .insert(listingData);
        
        if (error) {
          console.error(`❌ Error inserting listing ${listing.externalId}:`, error);
        } else {
          console.log(`✅ Created listing: ${listing.title}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error syncing listing ${listing.externalId}:`, error);
    }
  }
  
  // Deactivate listings that weren't seen (removed from source)
  const { error: deactivateError } = await supabase
    .from('external_listings')
    .update({ is_active: false })
    .eq('source', 'mars_dealership')
    .lt('last_seen_at', currentTime);
  
  if (deactivateError) {
    console.error('❌ Error deactivating old listings:', deactivateError);
  } else {
    console.log('✅ Deactivated removed listings');
  }
  
  console.log(`🎉 Sync complete! Processed ${listings.length} listings`);
}

// Main execution
export async function syncMarsDealer(supabaseUrl?: string, supabaseKey?: string) {
  try {
    console.log('🚀 Starting Mars Dealership sync...');
    console.log(`⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Tallinn' })} (Estonian Time)`);
    console.log(`🔑 Credentials check: url=${!!supabaseUrl || !!process.env.NEXT_PUBLIC_SUPABASE_URL}, key=${!!supabaseKey || !!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    
    const listings = await fetchListings();
    
    if (listings.length === 0) {
      console.log('⚠️ No listings found');
      return;
    }
    
    await syncListings(listings);
    
    console.log('✅ Mars Dealership sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    throw error;
  }
}

// If run directly
if (require.main === module) {
  syncMarsDealer()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
