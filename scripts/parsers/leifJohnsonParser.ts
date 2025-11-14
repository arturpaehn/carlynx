import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envPath) });

const SOURCE = 'leif_johnson';
const PHONE = '(512) 697-9012';
const CITY = 'Austin';
const STATE = 'TX';
const BASE_URL = 'https://www.iwanttobuyused.com/search/Used+t';

interface VehicleData {
  vin?: string;
  year?: string;
  make?: string;
  model?: string;
  price?: number;
  mileage?: number;
  imageUrl?: string; // Single image only
  detailUrl?: string;
  title?: string;
}

async function fetchImageFromDetailPage(browser: Browser, detailUrl: string): Promise<string | null> {
  const detailPage = await browser.newPage();
  try {
    await detailPage.goto(detailUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const imageUrl = await detailPage.evaluate(() => {
      // Ищем первую настоящую фотку машины (из homenetiol.com)
      const images = Array.from(document.querySelectorAll('img'));
      
      for (const img of images) {
        const src = img.src || img.getAttribute('src');
        if (src && src.includes('homenetiol.com') && img.width > 300) {
          return src;
        }
      }
      return null;
    });

    await detailPage.close();
    return imageUrl;
  } catch (error) {
    console.error(`Error fetching image from ${detailUrl}:`, error);
    await detailPage.close();
    return null;
  }
}

async function fetchVehiclesFromPage(page: Page, pageNum: number): Promise<VehicleData[]> {
  const url = pageNum === 1 ? BASE_URL : `${BASE_URL}?page=${pageNum}`;
  
  console.log(`📄 Fetching page ${pageNum}: ${url}`);
  
  await page.goto(url, { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });

  // Wait for results to load
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Extract vehicle data from the page
  const vehicles = await page.evaluate(() => {
    const results: VehicleData[] = [];
    
    // Get direct children of #result div (each child is one vehicle card)
    const resultDiv = document.querySelector('#result');
    if (!resultDiv) {
      console.log('No #result div found');
      return results;
    }

    const elements = resultDiv.children;
    if (!elements || elements.length === 0) {
      console.log('No vehicle elements found in #result');
      return results;
    }

    console.log(`Found ${elements.length} vehicle cards in #result`);

    Array.from(elements).forEach((el) => {
      try {
        const vehicle: VehicleData = {};

        // Try to get VIN from data attribute
        vehicle.vin = el.getAttribute('data-vin') || el.querySelector('[data-vin]')?.getAttribute('data-vin') || undefined;

        // Get title
        const titleEl = el.querySelector('h2, h3, .title, .vehicle-title, [class*="title"]');
        if (titleEl) {
          vehicle.title = titleEl.textContent?.trim();
        }

        // Get link
        const linkEl = el.querySelector('a[href*="/detail"], a[href*="/vehicle"], a[href*="/inventory"]');
        if (linkEl) {
          vehicle.detailUrl = linkEl.getAttribute('href') || undefined;
        }

        // Get image (placeholder - real images will be fetched from detail page)
        const imgEl = el.querySelector('img');
        if (imgEl) {
          const imgSrc = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');
          if (imgSrc) {
            vehicle.imageUrl = imgSrc; // Single image
          }
        }

        // Get price
        const priceEl = el.querySelector('[class*="price"], .price, [data-price]');
        if (priceEl) {
          const priceText = priceEl.textContent?.replace(/[^0-9]/g, '') || '';
          if (priceText) {
            vehicle.price = parseInt(priceText);
          }
        }

        // Get mileage
        const mileageEl = el.querySelector('[class*="mile"], [class*="mileage"]');
        if (mileageEl) {
          const mileageText = mileageEl.textContent?.replace(/[^0-9]/g, '') || '';
          if (mileageText) {
            vehicle.mileage = parseInt(mileageText);
          }
        }

        // Parse title for year/make/model if not already set
        if (vehicle.title) {
          const titleParts = vehicle.title.split(' ');
          if (titleParts.length >= 3) {
            // Extract year
            const yearMatch = vehicle.title.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
              vehicle.year = yearMatch[0];
              
              // Extract make and model (format: "2018 Ford F150 XLT...")
              const yearIndex = titleParts.findIndex(p => /^\d{4}$/.test(p));
              if (yearIndex >= 0 && titleParts.length > yearIndex + 2) {
                vehicle.make = titleParts[yearIndex + 1];  // First word after year
                vehicle.model = titleParts[yearIndex + 2]; // Second word after year
              }
            }
          }
        }

        results.push(vehicle);
      } catch (err) {
        console.error('Error parsing vehicle:', err);
      }
    });

    return results;
  });

  console.log(`✅ Found ${vehicles.length} vehicles on page ${pageNum}`);
  return vehicles;
}

export async function syncLeifJohnson(supabaseUrl?: string, supabaseKey?: string) {
  console.log('🚀 Starting Leif Johnson sync...');
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);

  // Initialize Supabase client with provided or environment credentials
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    console.log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const allVehicles: VehicleData[] = [];
    let pageNum = 1;
    const maxPages = 25; // Safety limit

    // Fetch all pages
    while (pageNum <= maxPages) {
      try {
        const vehicles = await fetchVehiclesFromPage(page, pageNum);
        
        if (vehicles.length === 0) {
          console.log(`No more vehicles found on page ${pageNum}, stopping.`);
          break;
        }

        allVehicles.push(...vehicles);
        pageNum++;

        // Small delay between pages
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error on page ${pageNum}:`, error);
        break;
      }
    }

    console.log(`\n✅ Total vehicles found: ${allVehicles.length}`);

    if (allVehicles.length === 0) {
      console.log('❌ No vehicles found to sync');
      await browser.close();
      return { success: false, message: 'No vehicles found' };
    }

    // Теперь получаем фотки для каждой машины
    console.log('\n📸 Fetching images from detail pages...');
    for (let i = 0; i < allVehicles.length; i++) {
      const vehicle = allVehicles[i];
      if (vehicle.detailUrl) {
        try {
          const fullUrl = vehicle.detailUrl.startsWith('http') 
            ? vehicle.detailUrl 
            : `https://www.iwanttobuyused.com${vehicle.detailUrl}`;
          
          const imageUrl = await fetchImageFromDetailPage(browser, fullUrl);
          if (imageUrl) {
            vehicle.imageUrl = imageUrl;
            console.log(`✅ Got image for ${vehicle.title || 'vehicle'} (${i + 1}/${allVehicles.length})`);
          } else {
            console.log(`⚠️  No image found for ${vehicle.title || 'vehicle'} (${i + 1}/${allVehicles.length})`);
          }
          
          // Небольшая задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error fetching image for ${vehicle.title}:`, error);
        }
      }
    }

    await browser.close();

    // Get location IDs (using same approach as other parsers)
    console.log(`📍 Looking up location: ${CITY}, ${STATE}`);
    
    const { data: stateData } = await supabase
      .from('states')
      .select('id')
      .eq('code', STATE)
      .single();

    if (!stateData) {
      throw new Error(`State not found: ${STATE}`);
    }

    const stateId = (stateData as { id: number }).id;

    const { data: cityData } = await supabase
      .from('cities')
      .select('id')
      .eq('state_id', stateId)
      .ilike('name', CITY)
      .single();

    const cityId = cityData ? (cityData as { id: number }).id : null;

    console.log(`📍 Location: ${CITY}, ${STATE} (state_id=${stateId}, city_id=${cityId})`);

    // Sync to database
    console.log(`\n💾 Syncing ${allVehicles.length} listings to database...`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const vehicle of allVehicles) {
      try {
        // Skip vehicles without price OR without image
        if (!vehicle.price || !vehicle.imageUrl) {
          console.log(`⏭️  Skipping ${vehicle.title || 'vehicle'}: ${!vehicle.price ? 'no price' : 'no image'}`);
          skipped++;
          continue;
        }

        // Create external_id from VIN or URL
        const externalId = vehicle.vin || vehicle.detailUrl?.split('/').pop() || `${vehicle.title}-${Math.random()}`;
        
        if (!externalId) {
          console.log('⏭️  Skipping vehicle without ID');
          skipped++;
          continue;
        }

        // Check if listing exists
        const { data: existing } = await supabase
          .from('external_listings')
          .select('id, image_url, views')
          .eq('external_id', externalId)
          .eq('source', SOURCE)
          .single();

        const listingData = {
          external_id: externalId,
          source: SOURCE,
          external_url: vehicle.detailUrl || BASE_URL,
          title: vehicle.make || 'Vehicle',  // Title = Brand only
          description: vehicle.title,        // Full title from site (e.g., "2018 Ford F150 XLT...")
          year: vehicle.year ? parseInt(vehicle.year) : null,
          brand: vehicle.make || null,
          model: vehicle.model || null,
          price: vehicle.price || null,
          mileage: vehicle.mileage || null,
          state_id: stateId,
          city_id: cityId,
          city_name: CITY,
          image_url: vehicle.imageUrl || null,
          image_url_2: null,
          image_url_3: null,
          image_url_4: null,
          contact_phone: PHONE,
          contact_email: null,
          is_active: true,
          last_seen_at: new Date().toISOString(),
          vehicle_type: 'car',
          views: existing?.views || 0
        };

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('external_listings')
            .update(listingData)
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Error updating ${externalId}:`, error.message);
          } else {
            console.log(`🔄 Updated listing: ${listingData.title}`);
            updated++;
          }
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('external_listings')
            .insert(listingData);

          if (insertError) {
            console.error(`❌ Error inserting ${externalId}:`, insertError.message);
          } else {
            console.log(`✅ Inserted listing: ${listingData.title}`);
            inserted++;
          }
        }

      } catch (error) {
        console.error('❌ Error processing vehicle:', error instanceof Error ? error.message : String(error));
        skipped++;
      }
    }

    // Deactivate removed listings
    console.log('\n🔄 Deactivating removed listings...');
    const allExternalIds = allVehicles
      .map(v => v.vin || v.detailUrl?.split('/').pop())
      .filter(Boolean);

    const { error: deactivateError } = await supabase
      .from('external_listings')
      .update({ is_active: false })
      .eq('source', SOURCE)
      .not('external_id', 'in', `(${allExternalIds.join(',')})`);

    if (deactivateError) {
      console.error('❌ Error deactivating listings:', deactivateError.message);
    } else {
      console.log('✅ Deactivated removed listings');
    }

    console.log('\n🎉 Sync complete!');
    console.log(`   📊 Inserted: ${inserted}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total processed: ${inserted + updated + skipped}`);

    return {
      success: true,
      inserted,
      updated,
      skipped,
      total: allVehicles.length
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error syncing Leif Johnson:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Run if called directly
if (require.main === module) {
  syncLeifJohnson()
    .then((result) => {
      if (result.success) {
        console.log('✅ Leif Johnson sync completed successfully!');
        process.exit(0);
      } else {
        console.error('❌ Leif Johnson sync failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}
