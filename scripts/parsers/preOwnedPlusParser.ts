import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envPath) });

const BASE_URL = 'https://www.preownedplus.com';
const INVENTORY_URL = `${BASE_URL}/inventory`;
const SOURCE = 'preowned_plus';
const COMPANY_PHONE = '(210) 951-5575';
const COMPANY_EMAIL = null; // No email on website
const CITY = 'San Antonio';
const STATE = 'TX';

interface Listing {
  url: string;
  title: string;
  description?: string;
  year: number | null;
  make: string | null;
  model: string | null;
  price: number | null;
  mileage: number | null;
  imageUrls: string[]; // Changed to array for multiple images (up to 4)
}

// Get Supabase client
function getSupabase(supabaseUrl?: string, supabaseKey?: string) {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(`Supabase credentials missing: url=${!!url}, key=${!!key}`);
  }

  return createClient(url, key, {
    db: { schema: 'public' },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Fetch images from vehicle detail page (up to 4)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchImageFromDetailPage(url: string, browser: any): Promise<string[]> {
  let page = null;
  try {
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait a bit for lazy-loaded images
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const imageUrls = await page.evaluate(() => {
      const foundUrls: string[] = [];
      
      // First, try to find ProMax inventory images (most reliable for this site)
      const promaxImages = Array.from(document.querySelectorAll('img[src*="imageserver.promaxinventory.com"]'));
      
      for (const img of promaxImages) {
        const src = (img as HTMLImageElement).src;
        // Make sure it's not a thumbnail
        if (src && !src.includes('/thumb/')) {
          foundUrls.push(src);
          if (foundUrls.length >= 4) return foundUrls;
        }
      }
      
      // If not enough images, try multiple selectors in order of priority
      const selectors = [
        'img[src*="promaxinventory"]',
        '.vehicle-image img',
        '#vehicle-image',
        'img[src*="/inventory/"]',
        'img[src*="/vehicles/"]',
        'img[src*="/photos/"]',
        '.main-image img',
        '.photo-gallery img',
        '[class*="photo"] img',
        '[class*="image"] img:not([class*="logo"])',
        '[id*="photo"] img',
        'img[alt*="Vehicle"]',
        'img[alt*="Photo"]'
      ];
      
      for (const selector of selectors) {
        if (foundUrls.length >= 4) break;
        
        const elements = document.querySelectorAll(selector);
        for (const el of Array.from(elements)) {
          const img = el as HTMLImageElement;
          const src = img.src;
          if (src && 
              src.startsWith('http') && 
              !src.includes('logo') && 
              !src.includes('icon') && 
              !src.includes('/thumb/') && 
              !src.includes('onepix.png') &&
              !foundUrls.includes(src)) {
            foundUrls.push(src);
            if (foundUrls.length >= 4) break;
          }
        }
      }
      
      // Final fallback: find the largest images that look like vehicle photos
      if (foundUrls.length < 4) {
        const images = Array.from(document.querySelectorAll('img'));
        const vehicleImages = images.filter(img => {
          const src = (img as HTMLImageElement).src || '';
          const alt = img.getAttribute('alt') || '';
          const width = (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width;
          const height = (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height;
          
          // Filter criteria
          return src.startsWith('http') &&
                 !src.includes('logo') && 
                 !src.includes('icon') &&
                 !src.includes('banner') &&
                 !src.includes('/thumb/') &&
                 !src.includes('onepix.png') &&
                 !alt.toLowerCase().includes('logo') &&
                 !foundUrls.includes(src) &&
                 width > 250 && 
                 height > 180;
        });
        
        // Sort by size and take remaining needed
        vehicleImages.sort((a, b) => {
          const aSize = ((a as HTMLImageElement).naturalWidth || (a as HTMLImageElement).width) * 
                       ((a as HTMLImageElement).naturalHeight || (a as HTMLImageElement).height);
          const bSize = ((b as HTMLImageElement).naturalWidth || (b as HTMLImageElement).width) * 
                       ((b as HTMLImageElement).naturalHeight || (b as HTMLImageElement).height);
          return bSize - aSize;
        });
        
        for (const img of vehicleImages) {
          if (foundUrls.length >= 4) break;
          foundUrls.push((img as HTMLImageElement).src);
        }
      }
      
      return foundUrls;
    });
    
    await page.close();
    return imageUrls;
  } catch (error) {
    console.error('❌ Error fetching images from detail page:', error);
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    // Silently fail - images are optional
    return [];
  }
}

// Fetch all listings using Puppeteer (handles JavaScript "Load Next Page")
async function fetchListings(): Promise<Listing[]> {
  const listings: Listing[] = [];
  
  console.log('🔍 Fetching Pre-owned Plus listings with Puppeteer...');
  console.log('🌐 Launching browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(INVENTORY_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('📄 Page loaded, clicking "Load Next Page" until all listings loaded...');

    // Click "Load Next Page" button until it disappears or max iterations
    let clickCount = 0;
    const maxClicks = 10; // Safety limit
    
    while (clickCount < maxClicks) {
      try {
        // Look for "Load Next Page" text and click it within page context
        const buttonClicked = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('button, a, div[role="button"], span[onclick]'));
          const loadButton = elements.find(el => {
            const text = el.textContent || '';
            return text.includes('Load Next Page') || 
                   text.includes('Load More') ||
                   text.includes('Next Page') ||
                   text.includes('next page');
          }) as HTMLElement;
          
          if (loadButton) {
            loadButton.click();
            return true;
          }
          return false;
        });
        
        if (!buttonClicked) {
          console.log('  ✅ No more "Load Next Page" button found');
          break;
        }

        console.log(`  🖱️  Clicked "Load Next Page" (${clickCount + 1})...`);
        
        // Wait for new content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        clickCount++;
        
      } catch {
        console.log('  ✅ Finished loading all pages');
        break;
      }
    }

    console.log('📊 Extracting listing data from page...');

    // Extract all vehicle listings from the page
    const vehicleData = await page.evaluate((baseUrl) => {
      const results: Array<{
        url: string;
        title: string;
        description: string;
        year: number | null;
        make: string | null;
        model: string | null;
        price: number | null;
        mileage: number | null;
        imageUrls: string[]; // Changed to array
      }> = [];

      // Find all links to VehicleDetails pages
      const links = document.querySelectorAll('a[href*="/VehicleDetails/"]');
      const processed = new Set<string>();

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || processed.has(href)) return;
        processed.add(href);

        // Fix URL construction: handle //domain.com/ URLs
        let fullUrl: string;
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullUrl = href;
        } else if (href.startsWith('//')) {
          fullUrl = 'https:' + href;
        } else if (href.startsWith('/')) {
          fullUrl = baseUrl + href;
        } else {
          fullUrl = baseUrl + '/' + href;
        }

        // Find the parent container for this listing
        let container: Element | null = link;
        for (let i = 0; i < 5; i++) {
          if (!container) break;
          const parent: Element | null = container.parentElement;
          if (!parent) break;
          
          // Check if this parent has stock/price/mileage info
          const text = parent.textContent || '';
          if (text.includes('Stock#:') && text.includes('Internet Price:')) {
            container = parent;
            break;
          }
          container = parent;
        }

        const containerText = container?.textContent || '';

        // Extract full title (will be used for description)
        const fullTitle = link.textContent?.trim() || '';
        if (!fullTitle) return;

        // Extract year
        const yearMatch = fullTitle.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : null;

        // Extract make and model
        let make: string | null = null;
        let model: string | null = null;
        const parts = fullTitle.replace(/^\d{4}\s+/, '').trim().split(' ');
        if (parts.length >= 2) {
          make = parts[0];  // First word after year = Brand (e.g., "Toyota")
          model = parts[1]; // Second word = Model (e.g., "Tacoma")
        }

        // Extract price
        const priceMatch = containerText.match(/Internet Price:\s*\$\s*([\d,]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

        // Extract mileage
        const mileageMatch = containerText.match(/Mileage:\s*([\d,]+)/);
        const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : null;

        // Only add if we have minimum required data (images will be fetched from detail page)
        if (fullTitle && fullUrl && price && make) {
          results.push({
            url: fullUrl,
            title: make,           // Title = Brand only (e.g., "Toyota")
            description: fullTitle, // Full title for description (e.g., "2024 Toyota Tacoma 4WD TRD...")
            year,
            make,                  // Brand (e.g., "Toyota")
            model,                 // Model only (e.g., "Tacoma")
            price,
            mileage,
            imageUrls: [] // Will be fetched later from detail page
          });
        }
      });

      return results;
    }, BASE_URL);

    console.log(`✅ Found ${vehicleData.length} listings`);
    
    console.log('📸 Fetching images from detail pages (this may take a while)...');

    // Fetch images from detail pages
    for (let i = 0; i < vehicleData.length; i++) {
      const listing = vehicleData[i];
      const progress = `[${i + 1}/${vehicleData.length}]`;
      console.log(`  ${progress} ${listing.title}`);
      
      const imageUrls = await fetchImageFromDetailPage(listing.url, browser);
      listing.imageUrls = imageUrls;
      
      // Small delay to be polite to the server
      if (i < vehicleData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    listings.push(...vehicleData);
    console.log(`✅ Completed! Total: ${listings.length} listings with images`);

  } catch (error) {
    console.error('❌ Error during Puppeteer scraping:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }

  return listings;
}

// Download image and upload to Supabase Storage
async function downloadAndUploadImage(
  imageUrl: string,
  listingId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${listingId}.${ext}`;
    const path = `${SOURCE}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('external-listing-images')
      .upload(path, buffer, {
        contentType: `image/${ext}`,
        upsert: true
      });

    if (uploadError) {
      console.error(`❌ Image upload error for ${listingId}:`, uploadError.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('external-listing-images')
      .getPublicUrl(path);

    return publicUrl;

  } catch (error) {
    console.error(`❌ Error downloading image for ${listingId}:`, error);
    return null;
  }
}

// Get San Antonio, TX location IDs from database
async function getLocationIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<{
  stateId: number;
  cityId: number | null;
}> {
  // Get Texas state ID
  const { data: stateData } = await supabase
    .from('states')
    .select('id')
    .eq('code', STATE)
    .single();

  if (!stateData) {
    throw new Error('Texas state not found in database');
  }

  const stateId = (stateData as { id: number }).id;

  // Try to get San Antonio city ID
  const { data: cityData } = await supabase
    .from('cities')
    .select('id')
    .eq('state_id', stateId)
    .ilike('name', CITY)
    .single();

  const cityId = cityData ? (cityData as { id: number }).id : null;

  return {
    stateId,
    cityId
  };
}

// Sync listings to database
async function syncListings(
  listings: Listing[],
  supabaseUrl?: string,
  supabaseKey?: string
) {
  const supabase = getSupabase(supabaseUrl, supabaseKey);
  const { stateId, cityId } = await getLocationIds(supabase);
  const currentTime = new Date().toISOString();

  console.log(`\n💾 Syncing ${listings.length} listings to database...`);
  console.log(`📍 Location: ${CITY}, ${STATE} (state_id=${stateId}, city_id=${cityId || 'null'})`);

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const listing of listings) {
    try {
      // Generate unique listing ID from URL
      const urlMatch = listing.url.match(/VehicleDetails\/(\d+)\/([^\/]+)/);
      const listingId = urlMatch ? `${urlMatch[1]}-${urlMatch[2]}` : listing.title.replace(/\s+/g, '-').toLowerCase();
      
      // Check if listing already exists
      const { data: existing } = await supabase
        .from('external_listings')
        .select('id, image_url, image_url_2, image_url_3, image_url_4')
        .eq('source', SOURCE)
        .eq('external_url', listing.url)
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
        console.log(`📥 Downloading ${listing.imageUrls.length} image(s) for ${listingId}...`);
        
        for (let i = 0; i < Math.min(listing.imageUrls.length, 4); i++) {
          if (!uploadedImageUrls[i]) { // Only upload if not already exists
            const uploaded = await downloadAndUploadImage(listing.imageUrls[i], `${listingId}-${i+1}`, supabase);
            if (uploaded) {
              uploadedImageUrls[i] = uploaded;
            }
          }
        }
        
        const uploadedCount = uploadedImageUrls.filter(url => url !== null).length;
        console.log(`✅ ${uploadedCount} image(s) ready for ${listingId}`);
      }

      const listingData = {
        external_id: listingId, // Use generated listing ID as external_id
        source: SOURCE,
        external_url: listing.url,
        title: listing.title,
        description: listing.description,
        year: listing.year,
        brand: listing.make,
        model: listing.model,
        price: listing.price,
        mileage: listing.mileage,
        state_id: stateId,
        city_id: cityId,
        city_name: CITY,
        image_url: uploadedImageUrls[0],
        image_url_2: uploadedImageUrls[1],
        image_url_3: uploadedImageUrls[2],
        image_url_4: uploadedImageUrls[3],
        contact_phone: COMPANY_PHONE,
        contact_email: COMPANY_EMAIL,
        is_active: true,
        last_seen_at: currentTime,
        vehicle_type: 'car' // Default to car
      };

      if (existing) {
        // Update existing listing
        const { error } = await supabase
          .from('external_listings')
          .update({
            ...listingData,
            updated_at: currentTime
          })
          .eq('id', existing.id);

        if (error) {
          console.error(`❌ Error updating listing ${listingId}:`, error);
          skippedCount++;
        } else {
          console.log(`✅ Updated listing: ${listing.title}`);
          updatedCount++;
        }
      } else {
        // Insert new listing
        const { error } = await supabase
          .from('external_listings')
          .insert(listingData);

        if (error) {
          console.error(`❌ Error inserting listing ${listingId}:`, error);
          skippedCount++;
        } else {
          console.log(`✅ Inserted listing: ${listing.title}`);
          insertedCount++;
        }
      }

    } catch (error) {
      console.error(`❌ Error processing listing:`, error);
      skippedCount++;
    }
  }

  // Deactivate listings that weren't seen in this sync
  const { error: deactivateError } = await supabase
    .from('external_listings')
    .update({ is_active: false })
    .eq('source', SOURCE)
    .lt('last_seen_at', currentTime);

  if (deactivateError) {
    console.error('❌ Error deactivating old listings:', deactivateError);
  } else {
    console.log('✅ Deactivated removed listings');
  }

  console.log(`\n🎉 Sync complete!`);
  console.log(`   📊 Inserted: ${insertedCount}`);
  console.log(`   🔄 Updated: ${updatedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   📝 Total processed: ${listings.length}`);
}

// Main sync function
export async function syncPreOwnedPlus(supabaseUrl?: string, supabaseKey?: string) {
  console.log('🚀 Starting Pre-owned Plus sync...');
  console.log(`⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Tallinn' })} (Estonian Time)`);
  
  // Verify credentials
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`🔑 Credentials check: url=${!!url}, key=${!!key}`);

  try {
    const listings = await fetchListings();
    
    // Filter out listings without price (CRITICAL FIX FROM PREVIOUS PARSERS)
    const validListings = listings.filter(l => l.price !== null);
    const skipped = listings.length - validListings.length;
    
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} listings without price`);
    }
    
    console.log(`✅ Total listings found: ${validListings.length}`);

    if (validListings.length === 0) {
      console.log('⚠️  No listings found, skipping sync');
      return;
    }

    await syncListings(validListings, supabaseUrl, supabaseKey);
    console.log('✅ Pre-owned Plus sync completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  syncPreOwnedPlus().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
