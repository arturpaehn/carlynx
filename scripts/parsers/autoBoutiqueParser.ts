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

// Fetch and parse Auto Boutique Texas listings from all pages
async function fetchListings(): Promise<ScrapedListing[]> {
  console.log('🔍 Fetching Auto Boutique Texas listings...');
  
  const allListings: ScrapedListing[] = [];
  const maxPages = 25; // Максимум 25 страниц как указал пользователь
  
  for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
    try {
      const url = currentPage === 1 
        ? 'https://www.autoboutiquetexas.com/used-vehicles-houston-tx'
        : `https://www.autoboutiquetexas.com/used-vehicles-houston-tx/page/${currentPage}`;
      
      console.log(`📄 Fetching page ${currentPage}/${maxPages}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️ Page ${currentPage} returned status ${response.status}, stopping.`);
        break;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const pageListings: ScrapedListing[] = [];
    
      // Parse each vehicle card - looking for vehicle links
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $('a[href*="/vehicle-details/"]').each((index: number, element: any) => {
        try {
          const $link = $(element);
          
          // Get the URL
          const href = $link.attr('href');
          if (!href || !href.includes('/vehicle-details/')) return;
          
          const externalUrl = href.startsWith('http') ? href : `https://www.autoboutiquetexas.com${href}`;
          
          // Extract ID from URL (e.g., "used-2021-toyota-corolla-le-5yfepmae8mp214314")
          const urlParts = href.split('/').filter(p => p);
          const externalId = urlParts[urlParts.length - 1] || `listing-${index}`;
          
          // Skip if we already processed this listing (same link appears multiple times)
          if (pageListings.find(l => l.externalId === externalId)) return;
          
          // Find the vehicle card container (parent elements)
          const $card = $link.closest('div').parent();
          
          // Get title - it's the link text itself in most cases
          let fullTitle = $link.text().trim();
          
          // If title is empty or too short, try to construct from URL
          if (!fullTitle || fullTitle.length < 5) {
            // Extract from URL: "used-2021-toyota-corolla-le-5yfepmae8mp214314"
            const parts = externalId.split('-');
            if (parts.length >= 4 && parts[0] === 'used') {
              const year = parts[1];
              const make = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
              const model = parts[3].charAt(0).toUpperCase() + parts[3].slice(1);
              const trim = parts.length > 4 && !parts[4].match(/^\d/) 
                ? parts[4].toUpperCase() 
                : '';
              fullTitle = `${year} ${make} ${model} ${trim}`.trim();
            }
          }
          
          if (!fullTitle || fullTitle.length < 5) return; // Skip invalid titles
          
          // Extract year from title or URL
          const yearMatch = fullTitle.match(/\b(19|20)\d{2}\b/) || externalId.match(/\b(19|20)\d{2}\b/);
          const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
          
          // Extract make and model from title
          const titleParts = fullTitle.split(' ').filter(p => p);
          let make: string | undefined;
          let model: string | undefined;
          
          if (titleParts.length >= 3) {
            // Format: "2021 Toyota Corolla LE" -> make = "Toyota", model = "Corolla"
            make = titleParts[1];   // First word after year = Brand
            model = titleParts[2];  // Second word = Model
          } else if (titleParts.length >= 2) {
            make = titleParts[1];
          }
          
          // Look for price in the card
          // Price format: "$15,200" or "$15,505"
          const priceText = $card.find('*').contents().filter(function() {
            return this.type === 'text' && $(this).text().includes('$');
          }).text();
          
          const priceMatch = priceText.match(/\$[\d,]+/);
          const price = priceMatch 
            ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) 
            : undefined;
          
          // Look for mileage
          // Format: "77,721miles" or "77,721 miles"
          const mileageText = $card.text();
          const mileageMatch = mileageText.match(/([\d,]+)\s*miles/i);
          const mileage = mileageMatch 
            ? parseInt(mileageMatch[1].replace(/,/g, '')) 
            : undefined;
          
          // Try to determine fuel type from title/model
          const titleLower = fullTitle.toLowerCase();
          let fuelType: string | undefined;
          if (titleLower.includes('tesla') || titleLower.includes('electric') || titleLower.includes(' ev ')) {
            fuelType = 'electric';
          } else if (titleLower.includes('hybrid')) {
            fuelType = 'hybrid';
          } else if (titleLower.includes('diesel')) {
            fuelType = 'diesel';
          } else {
            fuelType = 'gasoline'; // Default
          }
          
          // Determine vehicle type from title
          let vehicleType: string | undefined = 'car';
          if (titleLower.includes('truck') || titleLower.includes('f-150') || titleLower.includes('silverado')) {
            vehicleType = 'truck';
          } else if (titleLower.includes('suv') || titleLower.includes('highlander') || titleLower.includes('x5') || titleLower.includes('x3')) {
            vehicleType = 'suv';
          }
          
          // Extract image from the link (it usually has an img inside)
          const img = $link.find('img').first();
          let imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
          
          // If no image in link, look in the card
          if (!imageUrl) {
            const cardImg = $card.find('img').first();
            imageUrl = cardImg.attr('src') || cardImg.attr('data-src') || cardImg.attr('data-lazy-src');
          }
          
          // Make sure image URL is absolute
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `https://www.autoboutiquetexas.com${imageUrl}`;
          }
          
          // Skip placeholder images
          if (imageUrl?.includes('placeholder') || imageUrl?.includes('loading') || imageUrl?.includes('icon')) {
            imageUrl = undefined;
          }
          
          // Skip listings without price - we don't want them
          if (!price) {
            return;
          }
          
          // Default transmission (most cars are automatic)
          const transmission = 'automatic';
          
          pageListings.push({
            externalId,
            externalUrl,
            title: make || 'Unknown',  // Title = Brand only (e.g., "Toyota")
            description: fullTitle,    // Full title for description (e.g., "2021 Toyota Corolla LE")
            make,                      // Brand
            model,                     // Model only
            year,
            price,
            transmission,
            mileage,
            fuelType,
            vehicleType,
            imageUrl
          });
          
        } catch (err) {
          console.error(`❌ Error parsing listing ${index}:`, err);
        }
      });
    
      console.log(`  ✅ Found ${pageListings.length} listings on page ${currentPage}`);
      
      // If no listings found on this page, stop pagination
      if (pageListings.length === 0) {
        console.log(`⚠️ No listings found on page ${currentPage}, stopping pagination.`);
        break;
      }
      
      allListings.push(...pageListings);
      
      // Add small delay between requests to be polite
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error fetching page ${currentPage}:`, error);
      break;
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
    const fileName = `autoboutique-${externalId}-${Date.now()}.jpg`;
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

// Get Texas state ID and Houston city ID
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
  
  // Get Houston city ID
  const { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('state_id', stateId)
    .ilike('name', '%houston%')
    .single();
  
  if (cityError) {
    console.error('❌ Error fetching Houston city:', cityError);
    return { stateId, cityId: null };
  }
  
  return { stateId, cityId: cityData?.id || null };
}

// Sync listings to database
async function syncListings(listings: ScrapedListing[]) {
  const supabase = getSupabase();
  console.log(`🔄 Syncing ${listings.length} listings to database...`);
  
  const { stateId: texasStateId, cityId: houstonCityId } = await getLocationIds();
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
        .eq('source', 'auto_boutique_texas')
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
        source: 'auto_boutique_texas',
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
        contact_phone: '(713) 352-0777',
        contact_email: null,
        state_id: texasStateId,
        city_id: houstonCityId,
        city_name: 'Houston',
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
    .eq('source', 'auto_boutique_texas')
    .lt('last_seen_at', currentTime);
  
  if (deactivateError) {
    console.error('❌ Error deactivating old listings:', deactivateError);
  } else {
    console.log('✅ Deactivated removed listings');
  }
  
  console.log(`🎉 Sync complete! Processed ${listings.length} listings`);
}

// Main execution
export async function syncAutoBoutique(supabaseUrl?: string, supabaseKey?: string) {
  try {
    console.log('🚀 Starting Auto Boutique Texas sync...');
    console.log(`⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Tallinn' })} (Estonian Time)`);
    console.log(`🔑 Credentials check: url=${!!supabaseUrl || !!process.env.NEXT_PUBLIC_SUPABASE_URL}, key=${!!supabaseKey || !!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    
    const listings = await fetchListings();
    
    if (listings.length === 0) {
      console.log('⚠️ No listings found');
      return;
    }
    
    await syncListings(listings);
    
    console.log('✅ Auto Boutique Texas sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    throw error;
  }
}

// If run directly
if (require.main === module) {
  syncAutoBoutique()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
