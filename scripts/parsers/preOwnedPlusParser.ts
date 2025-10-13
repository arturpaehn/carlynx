import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

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
  year: number | null;
  make: string | null;
  model: string | null;
  price: number | null;
  mileage: number | null;
  imageUrl: string | null;
}

// Get Supabase client
function getSupabase(url?: string, key?: string) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = key || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(`Supabase credentials missing: url=${!!supabaseUrl}, key=${!!supabaseKey}`);
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Fetch image from vehicle detail page
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchImageFromDetailPage(url: string, browser: any): Promise<string | null> {
  let page = null;
  try {
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait a bit for lazy-loaded images
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const imageUrl = await page.evaluate(() => {
      // First, try to find ProMax inventory images (most reliable for this site)
      const promaxImages = Array.from(document.querySelectorAll('img[src*="imageserver.promaxinventory.com"]'));
      
      if (promaxImages.length > 0) {
        const firstImage = promaxImages[0] as HTMLImageElement;
        const src = firstImage.src;
        // Make sure it's not a thumbnail
        if (src && !src.includes('/thumb/')) {
          return src;
        }
      }
      
      // Try multiple selectors in order of priority
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
        'img[alt*="Photo"]',
        'img[alt*="Hyundai"]',
        'img[alt*="BMW"]',
        'img[alt*="Mercedes"]',
        'img[alt*="Used"]'
      ];
      
      for (const selector of selectors) {
        const img = document.querySelector(selector);
        if (img) {
          const src = (img as HTMLImageElement).src;
          if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !src.includes('/thumb/') && !src.includes('onepix.png')) {
            return src;
          }
        }
      }
      
      // Final fallback: find the largest image that looks like a vehicle photo
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
               width > 250 && 
               height > 180;
      });
      
      // Return the largest image
      if (vehicleImages.length > 0) {
        vehicleImages.sort((a, b) => {
          const aSize = ((a as HTMLImageElement).naturalWidth || (a as HTMLImageElement).width) * 
                       ((a as HTMLImageElement).naturalHeight || (a as HTMLImageElement).height);
          const bSize = ((b as HTMLImageElement).naturalWidth || (b as HTMLImageElement).width) * 
                       ((b as HTMLImageElement).naturalHeight || (b as HTMLImageElement).height);
          return bSize - aSize;
        });
        return (vehicleImages[0] as HTMLImageElement).src;
      }
      
      return null;
    });
    
    await page.close();
    return imageUrl;
  } catch (error) {
    console.error('❌ Error fetching image from detail page:', error);
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    // Silently fail - image is optional
    return null;
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
        year: number | null;
        make: string | null;
        model: string | null;
        price: number | null;
        mileage: number | null;
        imageUrl: string | null;
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

        // Extract title
        const title = link.textContent?.trim() || '';
        if (!title) return;

        // Extract year
        const yearMatch = title.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : null;

        // Extract make and model
        let make: string | null = null;
        let model: string | null = null;
        const parts = title.replace(/^\d{4}\s+/, '').trim().split(' ');
        if (parts.length >= 2) {
          make = parts[0];
          model = parts.slice(1).join(' ');
        }

        // Extract price
        const priceMatch = containerText.match(/Internet Price:\s*\$\s*([\d,]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

        // Extract mileage
        const mileageMatch = containerText.match(/Mileage:\s*([\d,]+)/);
        const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : null;

        // Only add if we have minimum required data (no image yet - will fetch from detail page)
        if (title && fullUrl && price) {
          results.push({
            url: fullUrl,
            title,
            year,
            make,
            model,
            price,
            mileage,
            imageUrl: null // Will be fetched later
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
      
      const imageUrl = await fetchImageFromDetailPage(listing.url, browser);
      listing.imageUrl = imageUrl;
      
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
        .select('id, image_url')
        .eq('source', SOURCE)
        .eq('external_url', listing.url)
        .single();

      // Download and upload image if we have one
      let uploadedImageUrl = existing?.image_url || null;
      if (listing.imageUrl && !existing?.image_url) {
        console.log(`📥 Downloading image for ${listingId}...`);
        uploadedImageUrl = await downloadAndUploadImage(listing.imageUrl, listingId, supabase);
        if (uploadedImageUrl) {
          console.log(`✅ Image uploaded for ${listingId}`);
        }
      }

      const listingData = {
        external_id: listingId, // Use generated listing ID as external_id
        source: SOURCE,
        external_url: listing.url,
        title: listing.title,
        year: listing.year,
        make: listing.make,
        model: listing.model,
        price: listing.price,
        mileage: listing.mileage,
        state_id: stateId,
        city_id: cityId,
        city_name: CITY,
        image_url: uploadedImageUrl,
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
