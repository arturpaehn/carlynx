import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
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
  imageUrls?: string[]; // Array for up to 4 images
}

// TEST MODE: Set to true to parse only 1 motorcycle for testing
// Note: When called via syncDreamMachines(), TEST_MODE is ignored (always processes all)
const TEST_MODE = process.env.TEST_MODE !== 'false';

// Parse year, make, model from title
function parseVehicleInfo(title: string): { year?: number; make?: string; model?: string } {
  // Example: "2025 BMW M 1000 XR Light White / M Motorsport"
  // Example: "2024 Harley-Davidson® FXLRS - Low Rider® S"
  
  const yearMatch = title.match(/^(\d{4})\s+/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
  
  // Remove year from title to get make and model
  const remainingTitle = title.replace(/^\d{4}\s+/, '');
  
  // Extract make (first word or two words for compound names)
  let make: string | undefined;
  let model: string | undefined;
  
  // Known makes with compound names
  const compoundMakes = ['Harley-Davidson', 'Indian Motorcycle', 'Howard Custom Boats', 'Can-Am'];
  
  for (const compoundMake of compoundMakes) {
    if (remainingTitle.startsWith(compoundMake)) {
      make = compoundMake.replace(/®/g, '').trim();
      model = remainingTitle.substring(compoundMake.length).trim();
      break;
    }
  }
  
  // If not a compound make, take first word
  if (!make) {
    const parts = remainingTitle.split(/\s+/);
    make = parts[0]?.replace(/®/g, '').trim();
    model = parts.slice(1).join(' ').trim();
  }
  
  // Clean up model - remove colors and extra descriptors
  if (model) {
    // Remove common color names and descriptors after them
    model = model
      .replace(/\s+(Light\s+)?White.*$/i, '')
      .replace(/\s+(Pearl\s+)?Black.*$/i, '')
      .replace(/\s+Red.*$/i, '')
      .replace(/\s+Blue.*$/i, '')
      .replace(/\s+Silver.*$/i, '')
      .replace(/\s+Gold.*$/i, '')
      .replace(/\s+Orange.*$/i, '')
      .replace(/\s+Green.*$/i, '')
      .replace(/\s+\/.*$/i, '') // Remove anything after slash
      .replace(/\s+-\s+.*$/i, '') // Remove anything after dash
      .trim();
  }
  
  return { year, make, model };
}

// Parse price from string
function parsePrice(priceStr: string): number | undefined {
  // Match dollar sign followed by numbers with optional commas
  const match = priceStr.match(/\$\s*([\d,]+)/);
  if (match) {
    const price = parseInt(match[1].replace(/,/g, ''));
    // Filter out invalid prices (like years: 2024, 2025)
    if (price > 999 && price < 1000000) {
      return price;
    }
  }
  return undefined;
}

// Parse mileage from description
function parseMileage(description: string): number | undefined {
  const match = description.match(/([\d,]+)\s*miles?/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return undefined;
}

// Download image and upload to Supabase Storage
async function downloadAndUploadImage(imageUrl: string, externalId: string): Promise<string | null> {
  const supabase = getSupabase();
  return downloadAndUploadImageWithClient(imageUrl, externalId, supabase);
}

async function downloadAndUploadImageWithClient(
  imageUrl: string, 
  externalId: string, 
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    console.log(`      📥 Downloading image...`);
    
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
      console.error(`      ❌ Error uploading image:`, error);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('external-listing-images')
      .getPublicUrl(fileName);
    
    console.log(`      ✅ Image uploaded`);
    return publicUrl;
    
  } catch (error) {
    console.error(`      ❌ Error processing image:`, error);
    return null;
  }
}

// Fetch and parse Dream Machines of Texas listings from multiple pages
async function fetchListings(testMode = TEST_MODE): Promise<ScrapedListing[]> {
  console.log('🔍 Fetching Dream Machines of Texas listings...');
  
  const allListings: ScrapedListing[] = [];
  const maxPages = testMode ? 1 : 10; // Test mode: only 1 page
  const processedUrls = new Set<string>(); // Track processed URLs to avoid duplicates
  let shouldStop = false; // Flag to stop all processing
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
      if (shouldStop) break;
      console.log(`\n📄 Fetching page ${currentPage}...`);
      
      const url = currentPage === 1
        ? 'https://www.dreammachinesoftexas.com/Harley-Davidson-BMW-Motorcycles-For-Sale-Dallas-TX--inventory'
        : `https://www.dreammachinesoftexas.com/Harley-Davidson-BMW-Motorcycles-For-Sale-Dallas-TX--inventory?pg=${currentPage}`;
      
      const page = await browser.newPage();
      
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        // Find all listing cards
        const listingCards = $('li.v7list-results__item').toArray();
        
        console.log(`   Found ${listingCards.length} listings on page ${currentPage}`);
        
        let processedCount = 0;
        const maxListings = testMode ? 1 : listingCards.length;
        let attemptCount = 0; // Track total attempts to avoid infinite loop
        const maxAttempts = testMode ? 10 : listingCards.length; // Max 10 attempts in test mode
        
        for (let i = 0; i < listingCards.length; i++) {
          // Stop if we've processed enough listings OR tried too many times OR shouldStop flag is set
          if (processedCount >= maxListings || attemptCount >= maxAttempts || shouldStop) {
            break;
          }
          
          attemptCount++;
          
          const card = $(listingCards[i]);
          
          // Get the detail URL from the main image link
          const detailUrl = card.find('a.vehicle__image').first().attr('href');
          
          if (!detailUrl || !detailUrl.includes('/Pre-owned-Inventory-')) {
            continue;
          }
          
          // Get image and price from PSM widget data attributes (more reliable than scraping)
          const psmWidget = card.find('.psm-pricedrop-srp-widget').first();
          const psmImageUrl = psmWidget.attr('data-psm-unitimageurl');
          const psmPriceStr = psmWidget.attr('data-psm-unitprice');
          
          let cardImageUrl: string | null = null;
          if (psmImageUrl) {
            cardImageUrl = psmImageUrl.startsWith('http') ? psmImageUrl : `https:${psmImageUrl}`;
          }
          
          // Get price from PSM widget
          let cardPrice: number | undefined;
          if (psmPriceStr) {
            const parsedPrice = parseInt(psmPriceStr, 10);
            if (!isNaN(parsedPrice) && parsedPrice > 999) {
              cardPrice = parsedPrice;
            }
          }
          
          const fullUrl = detailUrl.startsWith('http') 
            ? detailUrl 
            : `https://www.dreammachinesoftexas.com${detailUrl}`;
          
          // Skip if already processed this URL
          if (processedUrls.has(fullUrl)) {
            console.log(`\n   ⏭️  Already processed: ${fullUrl}`);
            continue;
          }
          
          // Skip boats in test mode - look for actual motorcycles
          if (testMode && fullUrl.includes('Howard-Custom-Boats')) {
            console.log(`\n   ⏭️  Skipping boat: ${fullUrl}`);
            continue;
          }
          
          console.log(`\n   🏍️  Processing: ${fullUrl}`);
          
          // Extract external ID from URL
          const idMatch = fullUrl.match(/--(\d+)$/);
          const externalId = idMatch ? idMatch[1] : fullUrl;
          
          // Use image from listing card (no need to visit detail page for images)
          const imageUrls: string[] = [];
          if (cardImageUrl && cardImageUrl.startsWith('http')) {
            imageUrls.push(cardImageUrl);
            console.log(`      Found card image: ${cardImageUrl.substring(0, 60)}...`);
          }
          
          // Navigate to detail page only for title/price/mileage
          const detailPage = await browser.newPage();
          
          try {
            await detailPage.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const detailHtml = await detailPage.content();
            const $detail = cheerio.load(detailHtml);
            
            // Extract title (year make model)
            const title = $detail('h1').first().text().trim();
            console.log(`      Title: ${title}`);
            
            // Parse year, make, model
            const { year, make, model } = parseVehicleInfo(title);
            console.log(`      Year: ${year}, Make: ${make}, Model: ${model}`);
            
            // Skip boats - we only want motorcycles
            if (make && (make.toLowerCase().includes('boat') || make.toLowerCase().includes('watercraft'))) {
              console.log(`      ⏭️  Skipping - not a motorcycle`);
              try {
                await detailPage.close();
              } catch {
                // Ignore close errors
              }
              continue;
            }
            
            // Extract price from card or detail page
            let price: number | undefined = cardPrice;
            
            // If no price from card, try parsing from detail page
            if (!price) {
              let priceText = $detail('*').filter(function() {
                return $(this).text().includes('Our Price');
              }).first().text();
              
              if (!priceText) {
                priceText = $detail('.price, .vehicle-price, [class*="price"]').first().text();
              }
              
              if (!priceText) {
                $detail('*').each(function() {
                  const text = $(this).text().trim();
                  if (text.match(/\$[\d,]+/) && text.length < 100) {
                    priceText = text;
                    return false; // break
                  }
                });
              }
              
              if (priceText) {
                price = parsePrice(priceText);
              }
            }
            
            if (price) {
              console.log(`      Price: $${price}`);
            }
            
            // Skip if no price found - price is required
            if (!price) {
              console.log(`      ⚠️  Skipping - no price found`);
              try {
                await detailPage.close();
              } catch {
                // Ignore close errors
              }
              continue;
            }
            
            // Extract description
            const description = $detail('*').filter(function() {
              return $(this).text().includes('YOU ARE LOOKING AT');
            }).first().text().trim();
            
            // Extract mileage from description
            const mileage = description ? parseMileage(description) : undefined;
            if (mileage) {
              console.log(`      Mileage: ${mileage} miles`);
            }
            
            // Image already extracted from card, skip if none
            if (imageUrls.length === 0) {
              console.log(`      ⏭️  Skipping - no images found`);
              try {
                await detailPage.close();
              } catch {
                // Ignore close errors
              }
              
              // In test mode, stop after max attempts
              if (testMode && attemptCount >= maxAttempts) {
                console.log(`\n⚠️  TEST MODE: Reached max attempts (${maxAttempts}). Stopping.`);
                break;
              }
              continue;
            }
            
            const listing: ScrapedListing = {
              externalId,
              externalUrl: fullUrl,
              title: make || 'Unknown',  // Title = Brand only (e.g., "BMW")
              description: title,        // Full title for description (e.g., "2025 BMW M 1000 XR Light White / M Motorsport")
              make,
              model,
              year,
              price,
              mileage,
              vehicleType: 'motorcycle', // lowercase to match database convention
              imageUrls: imageUrls.length > 0 ? imageUrls : undefined
            };
            
            allListings.push(listing);
            processedUrls.add(fullUrl); // Mark this URL as processed
            processedCount++; // Increment processed count
            
            console.log(`\n✅ Processed ${processedCount} listing(s)`);
            
            if (testMode) {
              console.log(`✅ TEST MODE: Processed 1 motorcycle. Stopping immediately.`);
              try {
                await detailPage.close();
              } catch {
                // Ignore close errors
              }
              shouldStop = true;
              break; // Exit the for loop immediately
            }
            
          } catch (error) {
            console.error(`      ❌ Error processing detail page: ${error}`);
          } finally {
            if (!TEST_MODE || !shouldStop) {
              try {
                await detailPage.close();
              } catch {
                // Ignore close errors - page might already be closed
              }
            }
          }
        }
        
      } catch (error) {
        console.error(`   ❌ Error fetching page ${currentPage}:`, error);
      } finally {
        try {
          await page.close();
        } catch {
          // Ignore close errors - page might already be closed
        }
      }
      
      if (TEST_MODE) break; // Stop after first page in test mode
    }
    
  } finally {
    try {
      await browser.close();
    } catch {
      // Ignore close errors - browser might already be closed
    }
  }
  
  console.log(`\n✅ Total listings scraped: ${allListings.length}`);
  return allListings;
}

// Save listings to Supabase
async function saveListings(listings: ScrapedListing[]) {
  console.log('\n💾 Saving listings to Supabase...');
  
  const supabase = getSupabase();
  
  // Get Texas state_id
  const { data: texasState, error: stateError } = await supabase
    .from('states')
    .select('id')
    .eq('code', 'TX')
    .single();
  
  if (stateError || !texasState) {
    console.error('❌ Could not find Texas state in database');
    return;
  }
  
  const stateId = texasState.id;
  console.log(`   Texas state_id: ${stateId}`);
  
  // Get or create Dallas city
  let { data: dallasCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'Dallas')
    .eq('state_id', stateId)
    .single();
  
  if (!dallasCity) {
    console.log('   Creating Dallas city...');
    const { data: newCity, error: createError } = await supabase
      .from('cities')
      .insert({ name: 'Dallas', state_id: stateId })
      .select()
      .single();
    
    if (createError || !newCity) {
      console.error('❌ Could not create Dallas city');
      return;
    }
    dallasCity = newCity;
  }
  
  const cityId = dallasCity!.id;
  console.log(`   Dallas city_id: ${cityId}`);
  
  let savedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const listing of listings) {
    try {
      // Check if listing already exists
      const { data: existing } = await supabase
        .from('external_listings')
        .select('id, image_url, image_url_2, image_url_3, image_url_4')
        .eq('external_id', listing.externalId)
        .eq('source', 'dream_machines_texas')
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
      
      // Upload new images (only 1 image for motorcycles)
      if (listing.imageUrls && listing.imageUrls.length > 0) {
        console.log(`   📥 Uploading image for ${listing.externalId}...`);
        
        // Only upload the first image
        const uploadedUrl = await downloadAndUploadImage(listing.imageUrls[0], `${listing.externalId}`);
        if (uploadedUrl) {
          uploadedImageUrls[0] = uploadedUrl;
          console.log(`   ✅ Image ready for ${listing.externalId}`);
        }
      }
      
      const listingData = {
        source: 'dream_machines_texas',
        external_id: listing.externalId,
        external_url: listing.externalUrl,
        title: listing.title,
        description: listing.description,
        brand: listing.make,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        mileage: listing.mileage,
        vehicle_type: listing.vehicleType,
        state_id: stateId,
        city_id: cityId,
        city_name: 'Dallas',
        contact_phone: '972-380-5151',
        contact_email: null,
        image_url: uploadedImageUrls[0],
        image_url_2: null, // Only 1 image for motorcycles
        image_url_3: null,
        image_url_4: null,
        last_seen_at: new Date().toISOString(),
        is_active: true
      };
      
      if (existing) {
        // Update existing listing
        const { error: updateError } = await supabase
          .from('external_listings')
          .update(listingData)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating listing ${listing.externalId}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Updated: ${listing.title}`);
          updatedCount++;
        }
      } else {
        // Insert new listing
        const { error: insertError } = await supabase
          .from('external_listings')
          .insert(listingData);
        
        if (insertError) {
          console.error(`   ❌ Error inserting listing ${listing.externalId}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Saved: ${listing.title}`);
          savedCount++;
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing listing ${listing.externalId}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ New listings saved: ${savedCount}`);
  console.log(`   🔄 Listings updated: ${updatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

// Main execution
async function main() {
  console.log('🚀 Dream Machines of Texas Parser');
  console.log(`📍 Mode: ${TEST_MODE ? 'TEST (1 motorcycle)' : 'FULL (10 pages)'}`);
  console.log('=' .repeat(50));
  
  try {
    const listings = await fetchListings();
    
    if (listings.length > 0) {
      await saveListings(listings);
    } else {
      console.log('\n⚠️  No listings found');
    }
    
    console.log('\n✅ Parser completed successfully');
  } catch (error) {
    console.error('\n❌ Parser failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for GitHub Actions
export async function syncDreamMachines(supabaseUrl: string, supabaseKey: string) {
  console.log('🏍️  Dream Machines of Texas Parser');
  console.log('📍 Mode: PRODUCTION (all listings)');
  console.log('=' .repeat(50));
  
  try {
    // Always run in production mode (testMode = false)
    const listings = await fetchListings(false);
    
    if (listings.length > 0) {
      // Override getSupabase to use provided credentials
      const supabase = createClient(supabaseUrl, supabaseKey, {
        db: { schema: 'public' },
        auth: { persistSession: false, autoRefreshToken: false }
      });
      
      // Save listings with provided Supabase client
      await saveListingsWithClient(listings, supabase);
    } else {
      console.log('\n⚠️  No listings found');
    }
    
    console.log('\n✅ Dream Machines parser completed successfully');
  } catch (error) {
    console.error('\n❌ Dream Machines parser failed:', error);
    throw error;
  }
}

// Helper function to save listings with a specific Supabase client
async function saveListingsWithClient(
  listings: ScrapedListing[], 
  supabase: SupabaseClient
) {
  console.log(`\n💾 Saving ${listings.length} listing(s) to Supabase...`);
  
  let savedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  // Get state_id and city_id
  const { data: stateData } = await supabase
    .from('states')
    .select('id')
    .eq('name', 'Texas')
    .single();
  
  if (!stateData) throw new Error('Texas state not found');
  console.log(`   Texas state_id: ${stateData.id}`);
  
  const { data: cityData } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'Dallas')
    .eq('state_id', stateData.id)
    .single();
  
  if (!cityData) throw new Error('Dallas city not found');
  console.log(`   Dallas city_id: ${cityData.id}`);
  
  for (const listing of listings) {
    try {
      // Upload image to Supabase Storage
      let imageUrl: string | null = null;
      
      if (listing.imageUrls && listing.imageUrls.length > 0) {
        console.log(`   📥 Uploading image for ${listing.externalUrl}...`);
        imageUrl = await downloadAndUploadImageWithClient(listing.imageUrls[0], listing.externalId, supabase);
      }
      
      if (!imageUrl) {
        console.log(`   ⚠️  No image uploaded for ${listing.externalId}`);
      } else {
        console.log(`   ✅ Image ready for ${listing.externalUrl}`);
      }
      
      const listingData = {
        external_id: listing.externalId,
        external_url: listing.externalUrl,
        source: 'dream_machines_texas',
        title: listing.title || listing.make || 'Unknown',
        description: listing.description,
        year: listing.year,
        brand: listing.make || 'Unknown',
        model: listing.model || 'Unknown',
        price: listing.price,
        mileage: listing.mileage,
        transmission: listing.transmission,
        fuel_type: listing.fuelType,
        vehicle_type: listing.vehicleType || 'motorcycle',
        image_url: imageUrl,
        image_url_2: null,
        image_url_3: null,
        image_url_4: null,
        state_id: stateData.id,
        city_id: cityData.id,
        last_seen_at: new Date().toISOString()
      };
      
      // Check if listing exists
      const { data: existingListing } = await supabase
        .from('external_listings')
        .select('id')
        .eq('external_id', listing.externalId)
        .eq('source', 'dream_machines_texas')
        .single();
      
      if (existingListing) {
        // Update existing listing
        const { error: updateError } = await supabase
          .from('external_listings')
          .update(listingData)
          .eq('id', existingListing.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating listing ${listing.externalId}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Updated: ${listing.make} ${listing.model}`);
          updatedCount++;
        }
      } else {
        // Insert new listing
        const { error: insertError } = await supabase
          .from('external_listings')
          .insert(listingData);
        
        if (insertError) {
          console.error(`   ❌ Error inserting listing ${listing.externalId}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Saved: ${listing.make} ${listing.model}`);
          savedCount++;
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing listing ${listing.externalId}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ New listings saved: ${savedCount}`);
  console.log(`   🔄 Listings updated: ${updatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

export { fetchListings, saveListings };
