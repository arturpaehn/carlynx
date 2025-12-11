import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envPath) });

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
  imageUrls?: string[]; // Multiple images from detail page (up to 4)
  vin?: string; // VIN code
}

// Fetch and parse Philpott Ford listings
async function fetchListings(): Promise<ScrapedListing[]> {
  console.log('🔍 Fetching Philpott Ford listings...');
  console.log('🌐 Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const allListings: ScrapedListing[] = [];
  
  try {
    const page = await browser.newPage();
    const baseUrl = 'https://www.philpottford.com/used-cars/nederland.htm';
    
    // First, check how many pages we need to scan
    console.log(`📄 Loading first page: ${baseUrl}`);
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for dynamic content to load (React/JS)
    console.log('⏳ Waiting for vehicle cards to load...');
    await page.waitForSelector('.vehicle-card', { timeout: 15000 }).catch(() => {
      console.log('⚠️ Timeout waiting for .vehicle-card, continuing anyway...');
    });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Count total vehicles to determine pages
    const totalCount = await page.evaluate(() => {
      // Try to find total count in pagination or header
      const paginationText = document.body.innerText;
      const countMatch = paginationText.match(/(\d+)\s+(?:vehicles|cars|results)/i);
      if (countMatch) {
        return parseInt(countMatch[1]);
      }
      
      // Count links as fallback
      const vehicleLinks = document.querySelectorAll('a[href*="/vehicle-details/"], a[href*="/inventory/"]');
      return vehicleLinks.length;
    });
    
    console.log(`📊 Found approximately ${totalCount} vehicles`);
    
    // Calculate number of pages (18 vehicles per page typically)
    const vehiclesPerPage = 18;
    const totalPages = Math.ceil(totalCount / vehiclesPerPage);
    console.log(`📄 Will scan ${totalPages} page(s)`);
    
    // Scan all pages
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const pageUrl = pageNum === 0 ? baseUrl : `${baseUrl}?start=${pageNum * vehiclesPerPage}`;
      
      console.log(`\n📄 Page ${pageNum + 1}/${totalPages}: ${pageUrl}`);
      
      if (pageNum > 0) {
        await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('.vehicle-card', { timeout: 15000 }).catch(() => {});
      }
      
      // Scroll down to trigger lazy loading of all cards
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Scroll back up
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract listings from current page
      const pageListings = await page.evaluate(() => {
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
          vin?: string;
        }> = [];
        
        // Find all vehicle cards (they are <li> elements with vehicle-card class)
        const vehicleCards = Array.from(document.querySelectorAll('li.vehicle-card'));
        
        vehicleCards.forEach((card, index) => {
          try {
            // Get UUID from data attribute
            const uuid = card.getAttribute('data-uuid') || `listing-${Date.now()}-${index}`;
            const externalId = uuid;
            
            // Get VIN from data-vin attribute (search in children)
            const vinElement = card.querySelector('[data-vin]');
            const vin = vinElement?.getAttribute('data-vin') || undefined;
            
            // Get link to detail page
            const linkEl = card.querySelector('a[href*="/used/"]');
            if (!linkEl) return;
            
            const href = (linkEl as HTMLAnchorElement).href;
            const externalUrl = href;
            
            // Get full title from link
            const titleEl = linkEl.querySelector('span');
            const fullTitle = titleEl?.textContent?.trim() || '';
            
            if (!fullTitle || fullTitle.length < 5) {
              return;
            }
            
            // Extract year
            const yearMatch = fullTitle.match(/\b(19|20)\d{2}\b/);
            const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
            
            // Extract make and model
            // Format: "2006 Ford F-150 SuperCrew Lariat Truck SuperCrew Cab V-8 cyl"
            const titleParts = fullTitle.split(' ');
            const yearIndex = titleParts.findIndex((p: string) => /^\d{4}$/.test(p));
            let make: string | undefined;
            let model: string | undefined;
            
            if (yearIndex >= 0 && titleParts.length > yearIndex + 2) {
              make = titleParts[yearIndex + 1];
              model = titleParts[yearIndex + 2];
            }
            
            // Get price from dd element
            const priceEl = card.querySelector('dd.final-price.internetPrice .price-value');
            let price: number | undefined;
            if (priceEl) {
              const priceText = priceEl.textContent?.replace(/[^0-9]/g, '') || '';
              if (priceText) {
                price = parseInt(priceText);
              }
            }
            
            // Get mileage from badge
            const mileageBadge = card.querySelector('.highlight-badge');
            let mileage: number | undefined;
            if (mileageBadge && mileageBadge.textContent?.includes('miles')) {
              const mileageText = mileageBadge.textContent.replace(/[^0-9]/g, '');
              if (mileageText) {
                mileage = parseInt(mileageText);
              }
            }
            
            // Check transmission from full title
            let transmission: string | undefined;
            const lowerTitle = fullTitle.toLowerCase();
            if (lowerTitle.includes('automatic') || lowerTitle.includes('cvt') || lowerTitle.includes('auto')) {
              transmission = 'automatic';
            } else if (lowerTitle.includes('manual')) {
              transmission = 'manual';
            }
            
            // Determine fuel type
            let fuelType: string | undefined;
            if (lowerTitle.includes('electric') || lowerTitle.includes(' ev ')) {
              fuelType = 'electric';
            } else if (lowerTitle.includes('hybrid')) {
              fuelType = 'hybrid';
            } else if (lowerTitle.includes('diesel')) {
              fuelType = 'diesel';
            } else {
              fuelType = 'gasoline';
            }
            
            // Only add if we have minimum data (make is required)
            if (make && fullTitle) {
              results.push({
                externalId,
                externalUrl,
                title: make, // Title is just the make (brand)
                description: fullTitle, // Description is the full title
                make,
                model,
                year,
                price,
                transmission,
                mileage,
                fuelType,
                vehicleType: 'car',
                vin
              });
            }
            
          } catch (err) {
            console.error(`Error parsing listing ${index}:`, err);
          }
        });
        
        return results;
      });
      
      console.log(`✅ Found ${pageListings.length} vehicles on page ${pageNum + 1}`);
      allListings.push(...pageListings);
    }
    
    console.log(`\n✅ Total listings collected: ${allListings.length}`);
    
    // Fetch images from detail pages
    console.log('\n📸 Fetching data from detail pages...');
    for (let i = 0; i < allListings.length; i++) {
      const listing = allListings[i];
      if (listing.externalUrl) {
        try {
          console.log(`  [${i + 1}/${allListings.length}] ${listing.make} ${listing.model || ''}...`);
          const detailData = await fetchImagesFromDetailPage(browser, listing.externalUrl);
          
          // Update listing with data from detail page
          if (detailData.imageUrls.length > 0) {
            listing.imageUrls = detailData.imageUrls;
          }
          if (detailData.vin) {
            listing.vin = detailData.vin;
          }
          if (detailData.price) {
            listing.price = detailData.price;
          }
          if (detailData.mileage) {
            listing.mileage = detailData.mileage;
          }
          
          console.log(`    ✅ Images: ${detailData.imageUrls.length}, VIN: ${detailData.vin ? 'Yes' : 'No'}, Price: ${detailData.price ? '$' + detailData.price : 'N/A'}, Mileage: ${detailData.mileage ? detailData.mileage + ' mi' : 'N/A'}`);
          
          if (detailData.imageUrls.length === 0) {
            console.log(`    ⚠️  No images found - will skip this listing`);
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`    ❌ Error fetching images for ${listing.make}:`, error);
        }
      }
    }
    
    // Filter out listings without images
    const listingsWithImages = allListings.filter(listing => listing.imageUrls && listing.imageUrls.length > 0);
    console.log(`\n✅ Listings with images: ${listingsWithImages.length}/${allListings.length}`);
    
    return listingsWithImages;
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

// Fetch images from detail page using Puppeteer (up to 4 images)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchImagesFromDetailPage(browser: any, detailUrl: string): Promise<{ imageUrls: string[]; vin: string | null; price: number | null; mileage: number | null }> {
  const page = await browser.newPage();
  try {
    await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const data = await page.evaluate(() => {
      const urls: string[] = [];
      const seen = new Set<string>();
      let vin: string | null = null;
      let price: number | null = null;
      let mileage: number | null = null;
      
      // Get all images - prioritize those from dealer.com
      const images = Array.from(document.querySelectorAll('img'));
      
      for (const img of images) {
        if (urls.length >= 4) break; // Maximum 4 images
        
        const imgEl = img as HTMLImageElement;
        let src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src');
        
        // Fix protocol-relative URLs
        if (src && src.startsWith('//')) {
          src = `https:${src}`;
        }
        
        // Only take images that:
        // 1. Have src
        // 2. Are from dealer.com (vehicle images) or ipacket.info
        // 3. Are larger than thumbnails (width > 200px)
        // 4. Are not logos/icons/placeholders
        // 5. Are not dealer logos (philpottfordfd in path but not vehicle images)
        // 6. Haven't been added yet
        if (src && 
            src.startsWith('http') &&
            (src.includes('dealer.com') || src.includes('ipacket.info')) &&
            !src.includes('logo') &&
            !src.includes('icon') &&
            !src.includes('placeholder') &&
            !src.includes('/logos/') &&
            !src.includes('dealership') &&
            !src.includes('webicon-cloudfront') &&
            (imgEl.width > 200 || imgEl.naturalWidth > 200) &&
            !seen.has(src)) {
          
          // Skip images that look like logos (small or square)
          if (imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
            const aspectRatio = imgEl.naturalWidth / imgEl.naturalHeight;
            // Vehicle photos are usually wider (aspect ratio > 1), logos are often square or tall
            if (aspectRatio < 0.9 || aspectRatio > 2.5) {
              continue;
            }
          }
          
          // Clean up URL parameters for better quality
          if (src.includes('dealer.com')) {
            // Remove size restrictions to get full size images
            src = src.split('?')[0] + '?impolicy=resize&w=800';
          }
          
          urls.push(src);
          seen.add(src);
        }
      }
      
      // Parse VIN
      const vinElement = document.querySelector('[data-vin]');
      if (vinElement) {
        vin = vinElement.getAttribute('data-vin');
      }
      
      // Parse price
      const priceElement = document.querySelector('dd.final-price.internetPrice .price-value');
      if (priceElement && priceElement.textContent) {
        const priceText = priceElement.textContent.replace(/[^0-9]/g, '');
        if (priceText) {
          price = parseInt(priceText);
        }
      }
      
      // Parse mileage - try multiple selectors
      const allDdElements = Array.from(document.querySelectorAll('dd'));
      const mileageElement = allDdElements.find(dd => {
        const text = dd.textContent || '';
        return text.toLowerCase().includes('mile');
      });
      
      if (mileageElement && mileageElement.textContent) {
        const text = mileageElement.textContent;
        const mileageText = text.replace(/[^0-9]/g, '');
        if (mileageText) {
          mileage = parseInt(mileageText);
        }
      }
      
      return { 
        imageUrls: urls.slice(0, 4),
        vin,
        price,
        mileage
      };
    });
    
    await page.close();
    return data;
  } catch (error) {
    console.error(`  Error fetching data from ${detailUrl}:`, error);
    await page.close();
    return { imageUrls: [], vin: null, price: null, mileage: null };
  }
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
    const fileName = `philpott-${externalId}-${Date.now()}.jpg`;
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

// Get Texas state ID and Nederland city ID
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
  
  // Get Nederland city ID
  const { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('state_id', stateId)
    .ilike('name', '%nederland%')
    .single();
  
  if (cityError) {
    console.error('❌ Error fetching Nederland city:', cityError);
    return { stateId, cityId: null };
  }
  
  return { stateId, cityId: cityData?.id || null };
}

// Sync listings to database
async function syncListings(listings: ScrapedListing[]) {
  const supabase = getSupabase();
  console.log(`🔄 Syncing ${listings.length} listings to database...`);
  
  const { stateId: texasStateId, cityId: nederlandCityId } = await getLocationIds();
  const currentTime = new Date().toISOString();
  const seenExternalIds = new Set<string>();
  
  for (const listing of listings) {
    try {
      seenExternalIds.add(listing.externalId);
      
      // Check if listing already exists
      const { data: existing } = await supabase
        .from('external_listings')
        .select('id, image_url, image_url_2, image_url_3, image_url_4, views')
        .eq('external_id', listing.externalId)
        .eq('source', 'philpott_ford')
        .single();
      
      // Download and upload images (up to 4)
      const uploadedImageUrls: (string | null)[] = [null, null, null, null];
      
      // Keep existing images if available
      if (existing) {
        uploadedImageUrls[0] = existing.image_url || null;
        uploadedImageUrls[1] = existing.image_url_2 || null;
        uploadedImageUrls[2] = existing.image_url_3 || null;
        uploadedImageUrls[3] = existing.image_url_4 || null;
      }
      
      // Upload new images
      if (listing.imageUrls && listing.imageUrls.length > 0) {
        console.log(`📥 Downloading ${listing.imageUrls.length} image(s) for ${listing.externalId}...`);
        
        for (let i = 0; i < Math.min(listing.imageUrls.length, 4); i++) {
          // Upload each image
          const uploadedUrl = await downloadAndUploadImage(listing.imageUrls[i], `${listing.externalId}-${i+1}`);
          if (uploadedUrl) {
            uploadedImageUrls[i] = uploadedUrl;
          }
        }
        
        const uploadedCount = uploadedImageUrls.filter(url => url !== null).length;
        console.log(`✅ ${uploadedCount} image(s) ready for ${listing.externalId}`);
      }
      
      const listingData = {
        external_id: listing.externalId,
        source: 'philpott_ford',
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
        image_url: uploadedImageUrls[0],
        image_url_2: uploadedImageUrls[1],
        image_url_3: uploadedImageUrls[2],
        image_url_4: uploadedImageUrls[3],
        vin: listing.vin,
        contact_phone: '409-403-1481',
        contact_email: null,
        state_id: texasStateId,
        city_id: nederlandCityId,
        city_name: 'Nederland',
        last_seen_at: currentTime,
        is_active: true,
        views: existing?.views || 0
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
          console.log(`✅ Updated listing: ${listing.title} - ${listing.description}`);
        }
      } else {
        // Insert new listing
        const { error } = await supabase
          .from('external_listings')
          .insert(listingData);
        
        if (error) {
          console.error(`❌ Error inserting listing ${listing.externalId}:`, error);
        } else {
          console.log(`✅ Created listing: ${listing.title} - ${listing.description}`);
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
    .eq('source', 'philpott_ford')
    .lt('last_seen_at', currentTime);
  
  if (deactivateError) {
    console.error('❌ Error deactivating old listings:', deactivateError);
  } else {
    console.log('✅ Deactivated removed listings');
  }
  
  console.log(`🎉 Sync complete! Processed ${listings.length} listings`);
}

// Main execution
export async function syncPhilpottFord(supabaseUrl?: string, supabaseKey?: string) {
  try {
    console.log('🚀 Starting Philpott Ford sync...');
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
      console.log(`   Transmission: ${listing.transmission}`);
      console.log(`   Images: ${listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls.length : 0}`);
    });
    
    await syncListings(listings);
    
    console.log('✅ Philpott Ford sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    throw error;
  }
}

// If run directly
if (require.main === module) {
  syncPhilpottFord()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
