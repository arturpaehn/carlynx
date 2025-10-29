import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

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

// Fetch and parse Auto Center of Texas listings
async function fetchListings(): Promise<ScrapedListing[]> {
  console.log('🔍 Fetching Auto Center of Texas listings...');
  console.log('🌐 Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const listings: ScrapedListing[] = [];
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.autocenteroftexas.com/used-vehicles-terrell-tx?limit=50';
    
    console.log(`📄 Loading page: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for vehicle cards to appear
    console.log('⏳ Waiting for vehicle listings to load...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds for content to load
    
    console.log('✅ Proceeding to extract data');
    
    console.log('📊 Extracting listing data...');
    
    // First check if links exist
    const linkCount = await page.evaluate(() => {
      return document.querySelectorAll('a[href*="/vehicle-details/"]').length;
    });
    
    console.log(`Found ${linkCount} vehicle-details links on page`);
    
    if (linkCount === 0) {
      console.log('⚠️ No vehicle-details links found, page may not have loaded properly');
      const bodyLength = await page.evaluate(() => document.body.innerHTML.length);
      console.log(`Body HTML length: ${bodyLength}`);
    }
    
    // Extract listings from the page
    const vehicleData = await page.evaluate(() => {
      const results: Array<{
        externalId: string;
        externalUrl: string;
        title: string;
        description: string;
        make?: string;
        model?: string;
        year?: number;
        price?: number;
        transmission?: string;
        mileage?: number;
        fuelType?: string;
        vehicleType?: string;
        imageUrl?: string;
      }> = [];
      
      const debugInfo: string[] = [];
      
      // Find all links to vehicle detail pages
      const vehicleLinks = Array.from(document.querySelectorAll('a[href*="/vehicle-details/"]'));
      const processed = new Set<string>();
      
      debugInfo.push(`Found ${vehicleLinks.length} vehicle detail links`);
      
      vehicleLinks.forEach((link, index) => {
        try {
          const href = (link as HTMLAnchorElement).href;
          
          // Skip duplicates
          if (processed.has(href)) return;
          processed.add(href);
          
          // Extract ID from URL (e.g., "id-61739720")
          const idMatch = href.match(/id-(\d+)/);
          const externalId = idMatch ? idMatch[1] : `listing-${index}`;
          
          const externalUrl = href;
          
          // Get full title/description - try link text first, then look in parent
          let fullTitle = link.textContent?.trim() || '';
          
          // If link text is empty, search in parent container or siblings
          if (!fullTitle || fullTitle.length < 5) {
            // Try to find title in parent or nearby elements
            let searchEl: Element | null = link;
            for (let i = 0; i < 5; i++) {
              if (!searchEl) break;
              const parent: Element | null = searchEl.parentElement;
              if (!parent) break;
              searchEl = parent;
              
              // Look for title elements
              if (searchEl) {
                const titleEl = searchEl.querySelector('h2, h3, h4, .title, [class*="title"]');
                if (titleEl && titleEl.textContent) {
                  const candidateTitle = titleEl.textContent.trim();
                  if (candidateTitle.length > 5 && /\b(19|20)\d{2}\b/.test(candidateTitle)) {
                    fullTitle = candidateTitle;
                    break;
                  }
                }
              }
            }
          }
          
          // Debug first few
          if (index < 3) {
            debugInfo.push(`Listing ${index}: title="${fullTitle.substring(0, 50)}", length=${fullTitle.length}`);
          }
          
          if (!fullTitle || fullTitle.length < 5) {
            if (index < 3) debugInfo.push(`  -> Skipped: title too short`);
            return;
          }
          
          // Extract year
          const yearMatch = fullTitle.match(/\b(19|20)\d{2}\b/);
          const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
          
          // Extract make and model
          const titleParts = fullTitle.split(' ');
          const yearIndex = titleParts.findIndex((p: string) => /^\d{4}$/.test(p));
          let make: string | undefined;
          let model: string | undefined;
          
          if (yearIndex >= 0 && titleParts.length > yearIndex + 2) {
            make = titleParts[yearIndex + 1];
            model = titleParts[yearIndex + 2];
          }
          
          // Find parent container for additional data
          let container: Element | null = link;
          for (let i = 0; i < 5; i++) {
            if (!container) break;
            const parent: Element | null = container.parentElement;
            if (!parent) break;
            container = parent;
            // Look for a container that has price/mileage info
            if (container?.textContent?.includes('Sale Price') || container?.textContent?.includes('Mileage:')) {
              break;
            }
          }
          
          const containerText = container?.textContent || '';
          
          // Extract price
          const priceMatch = containerText.match(/Sale Price[^\d]*\$\s*([\d,]+)/i) ||
                           containerText.match(/\$\s*([\d,]+)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : undefined;
          
          // Extract mileage
          const mileageMatch = containerText.match(/Mileage:\s*([\d,]+)/i);
          const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : undefined;
          
          // Extract transmission
          let transmission: string | undefined;
          if (containerText.toLowerCase().includes('automatic') || containerText.toLowerCase().includes('cvt')) {
            transmission = 'automatic';
          } else if (containerText.toLowerCase().includes('manual')) {
            transmission = 'manual';
          }
          
          // Determine fuel type
          let fuelType: string | undefined;
          const lowerTitle = fullTitle.toLowerCase();
          const lowerContainer = containerText.toLowerCase();
          
          if (lowerTitle.includes('electric') || lowerTitle.includes(' ev ') || lowerContainer.includes('electric')) {
            fuelType = 'electric';
          } else if (lowerTitle.includes('hybrid') || lowerContainer.includes('hybrid')) {
            fuelType = 'hybrid';
          } else if (lowerTitle.includes('diesel') || lowerContainer.includes('diesel')) {
            fuelType = 'diesel';
          } else {
            fuelType = 'gasoline';
          }
          
          // Extract image - look for images near the link
          let imageUrl: string | undefined;
          if (container) {
            const nearbyImages = container.querySelectorAll('img');
            
            for (const img of Array.from(nearbyImages)) {
              const src = (img as HTMLImageElement).src || 
                         img.getAttribute('data-src') || 
                         img.getAttribute('data-lazy-src');
              
              if (src && !src.includes('placeholder') && !src.includes('loading') && !src.includes('logo')) {
                // Handle protocol-relative URLs (//cdn-ds.com/...)
                if (src.startsWith('//')) {
                  imageUrl = `https:${src}`;
                } else if (src.startsWith('http')) {
                  imageUrl = src;
                } else if (src.startsWith('/')) {
                  imageUrl = `https://www.autocenteroftexas.com${src}`;
                } else {
                  imageUrl = `https://www.autocenteroftexas.com/${src}`;
                }
                break;
              }
            }
          }
          
          // Only add if we have minimum data
          if (make && fullTitle) {
            results.push({
              externalId,
              externalUrl,
              title: make,
              description: fullTitle,
              make,
              model,
              year,
              price,
              transmission,
              mileage,
              fuelType,
              vehicleType: 'car',
              imageUrl
            });
          } else {
            if (index < 3) debugInfo.push(`  -> Skipped: no make extracted`);
          }
          
        } catch (err) {
          debugInfo.push(`Error parsing listing ${index}: ${err}`);
        }
      });
      
      return { results, debugInfo };
    });
    
    // Print debug info
    console.log('Debug info from browser:');
    vehicleData.debugInfo.forEach(msg => console.log(`  ${msg}`));
    
    listings.push(...vehicleData.results);
    console.log(`✅ Total listings found: ${listings.length}`);
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
  
  return listings;
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
    const fileName = `autocenter-${externalId}-${Date.now()}.jpg`;
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

// Get Texas state ID and Terrell city ID
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
  
  // Get Terrell city ID
  const { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('state_id', stateId)
    .ilike('name', '%terrell%')
    .single();
  
  if (cityError) {
    console.error('❌ Error fetching Terrell city:', cityError);
    return { stateId, cityId: null };
  }
  
  return { stateId, cityId: cityData?.id || null };
}

// Sync listings to database
async function syncListings(listings: ScrapedListing[]) {
  const supabase = getSupabase();
  console.log(`🔄 Syncing ${listings.length} listings to database...`);
  
  const { stateId: texasStateId, cityId: terrellCityId } = await getLocationIds();
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
        .eq('source', 'auto_center_texas')
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
        source: 'auto_center_texas',
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
        contact_phone: '(972) 524-0306',
        contact_email: null,
        state_id: texasStateId,
        city_id: terrellCityId,
        city_name: 'Terrell',
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
    .eq('source', 'auto_center_texas')
    .lt('last_seen_at', currentTime);
  
  if (deactivateError) {
    console.error('❌ Error deactivating old listings:', deactivateError);
  } else {
    console.log('✅ Deactivated removed listings');
  }
  
  console.log(`🎉 Sync complete! Processed ${listings.length} listings`);
}

// Main execution
export async function syncAutoCenterTexas(supabaseUrl?: string, supabaseKey?: string) {
  try {
    console.log('🚀 Starting Auto Center of Texas sync...');
    console.log(`⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} (Texas Time)`);
    console.log(`🔑 Credentials check: url=${!!supabaseUrl || !!process.env.NEXT_PUBLIC_SUPABASE_URL}, key=${!!supabaseKey || !!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    
    const listings = await fetchListings();
    
    if (listings.length === 0) {
      console.log('⚠️ No listings found');
      return;
    }
    
    // Show sample listings for debugging
    console.log('\n📋 Sample listings (first 3):');
    listings.slice(0, 3).forEach((listing, i) => {
      console.log(`\n${i + 1}. ${listing.description}`);
      console.log(`   URL: ${listing.externalUrl}`);
      console.log(`   Make: ${listing.make}, Model: ${listing.model}, Year: ${listing.year}`);
      console.log(`   Price: $${listing.price}, Mileage: ${listing.mileage} miles`);
      console.log(`   Image: ${listing.imageUrl ? '✅' : '❌'}`);
    });
    
    await syncListings(listings);
    
    console.log('✅ Auto Center of Texas sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    throw error;
  }
}

// If run directly
if (require.main === module) {
  syncAutoCenterTexas()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
