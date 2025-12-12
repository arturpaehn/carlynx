import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SOURCE = 'right_drive';
const CONTACT_PHONE = '(915) 344-7272';
const CITY_NAME = 'El Paso';

interface VehicleData {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
  transmission?: string;
  fuel?: string;
  exteriorcolor?: string;
  photocount: number;
  photos: string[];
  url: string;
}

interface ScrapedListing {
  external_id: string;
  source: string;
  external_url: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number | null;
  mileage: number | null;
  transmission: string | null;
  fuel_type: string | null;
  vehicle_type: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
  vin: string | null;
  contact_phone: string;
  contact_email: string | null;
  city_name: string;
  state_id: number;
  city_id: number | null;
}

function normalizeTransmission(trans?: string): string | null {
  if (!trans) return null;
  const lower = trans.toLowerCase();
  if (lower.includes('auto')) return 'Automatic';
  if (lower.includes('manual')) return 'Manual';
  return trans;
}

function normalizeFuelType(fuel?: string): string | null {
  if (!fuel) return null;
  const lower = fuel.toLowerCase();
  if (lower === 'gasoline') return 'Gasoline';
  if (lower === 'diesel') return 'Diesel';
  if (lower === 'electric') return 'Electric';
  if (lower === 'hybrid') return 'Hybrid';
  if (lower === 'flex fuel') return 'Flex Fuel';
  return fuel;
}

async function getLocationIds(): Promise<{ stateId: number | null; cityId: number | null }> {
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
  
  // Get El Paso city ID
  const { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('state_id', stateId)
    .ilike('name', '%el paso%')
    .single();
  
  if (cityError) {
    console.error('❌ Error fetching El Paso city:', cityError);
    return { stateId, cityId: null };
  }
  
  return { stateId, cityId: cityData?.id || null };
}

async function fetchListings(): Promise<ScrapedListing[]> {
  console.log('\n🚀 Starting Right Drive parser...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const allVehicles: VehicleData[] = [];
  let currentPage = 1;
  
  try {
    while (true) {
      const url = currentPage === 1 
        ? 'https://www.rightdriveauto.com/inventory'
        : `https://www.rightdriveauto.com/inventory/page/${currentPage}`;
      
      console.log(`\n📄 Loading page ${currentPage}: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract JSON data from Next.js script tag
      const pageVehicles = await page.evaluate(() => {
        const scriptTag = document.querySelector('#__NEXT_DATA__');
        if (!scriptTag?.textContent) return [];
        
        try {
          const data = JSON.parse(scriptTag.textContent);
          const vehicles = data.props?.pageProps?.inventory?.results;
          
          if (!Array.isArray(vehicles)) return [];
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return vehicles.map((v: any) => ({
            vin: v.vin || '',
            year: v.year || 0,
            make: v.make || '',
            model: v.model || '',
            trim: v.trim || '',
            price: v.price || 0,
            mileage: v.mileage || 0,
            transmission: v.drivetrainstandard || '',
            fuel: v.fuel || '',
            exteriorcolor: v.exteriorcolor || '',
            photocount: v.photocount || 0,
            photos: v.photos || [],
            url: v.url || ''
          }));
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          return [];
        }
      });
      
      if (!pageVehicles || pageVehicles.length === 0) {
        console.log(`⚠️  No vehicles found on page ${currentPage}, stopping pagination`);
        break;
      }
      
      console.log(`✅ Found ${pageVehicles.length} vehicles on page ${currentPage}`);
      allVehicles.push(...pageVehicles);
      
      // Check if there are more pages
      const hasNextPage = await page.evaluate(() => {
        const nextLink = document.querySelector('a[href*="/inventory/page/"]');
        return !!nextLink;
      });
      
      if (!hasNextPage) {
        console.log('📌 No more pages');
        break;
      }
      
      currentPage++;
      
      // Safety limit
      if (currentPage > 20) {
        console.log('⚠️  Reached page limit (20)');
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Error fetching listings:', error);
  } finally {
    await browser.close();
  }
  
  console.log(`\n📊 Total vehicles found: ${allVehicles.length}\n`);
  
  // Transform to ScrapedListing format
  const scrapedListings: ScrapedListing[] = [];
  
  for (const vehicle of allVehicles) {
    if (!vehicle.vin || !vehicle.make || !vehicle.model) {
      console.log(`⚠️  Skipping vehicle without VIN/make/model:`, vehicle);
      continue;
    }
    
    // Get up to 4 photos
    const photos = vehicle.photos.slice(0, 4).map((url: string) => 
      url.replace('-thumb.webp', '.webp') // Convert thumbnail URLs to full size
    );
    
    if (photos.length === 0) {
      console.log(`⚠️  Skipping ${vehicle.year} ${vehicle.make} ${vehicle.model} - no photos`);
      continue;
    }
    
    const listing: ScrapedListing = {
      external_id: vehicle.vin,
      source: SOURCE,
      external_url: `https://www.rightdriveauto.com${vehicle.url}`,
      title: vehicle.make, // Only brand name
      brand: vehicle.make,
      model: vehicle.trim ? `${vehicle.model} ${vehicle.trim}` : vehicle.model,
      year: vehicle.year,
      price: vehicle.price || null,
      mileage: vehicle.mileage || null,
      transmission: normalizeTransmission(vehicle.transmission),
      fuel_type: normalizeFuelType(vehicle.fuel),
      vehicle_type: null,
      image_url: photos[0] || null,
      image_url_2: photos[1] || null,
      image_url_3: photos[2] || null,
      image_url_4: photos[3] || null,
      vin: vehicle.vin,
      contact_phone: CONTACT_PHONE,
      contact_email: null,
      city_name: CITY_NAME,
      state_id: 0, // Will be set in syncListings
      city_id: 0 // Will be set in syncListings
    };
    
    scrapedListings.push(listing);
    
    console.log(`✅ Images: ${photos.length}, VIN: ${vehicle.vin}, Price: $${vehicle.price}, Mileage: ${vehicle.mileage} mi`);
    console.log(`   ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ' ' + vehicle.trim : ''}`);
  }
  
  return scrapedListings;
}

async function syncListings(listings: ScrapedListing[]) {
  console.log(`\n💾 Syncing ${listings.length} listings to database...\n`);
  
  const { stateId: texasStateId, cityId: elPasoCityId } = await getLocationIds();
  const currentTime = new Date().toISOString();
  
  for (const listing of listings) {
    try {
      // Check if listing exists
      const { data: existing } = await supabase
        .from('external_listings')
        .select('id, image_url, image_url_2, image_url_3, image_url_4, views')
        .eq('external_id', listing.external_id)
        .eq('source', SOURCE)
        .single();
      
      const listingData = {
        ...listing,
        state_id: texasStateId,
        city_id: elPasoCityId,
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
          console.error(`❌ Error updating ${listing.brand} ${listing.model}:`, error);
        } else {
          console.log(`✅ Updated: ${listing.year} ${listing.brand} ${listing.model} (VIN: ${listing.vin})`);
        }
      } else {
        // Insert new listing
        const { error } = await supabase
          .from('external_listings')
          .insert(listingData);
        
        if (error) {
          console.error(`❌ Error inserting ${listing.brand} ${listing.model}:`, error);
        } else {
          console.log(`✅ Created: ${listing.year} ${listing.brand} ${listing.model} (VIN: ${listing.vin})`);
        }
      }
    } catch (error) {
      console.error(`❌ Error syncing ${listing.brand} ${listing.model}:`, error);
    }
  }
  
  console.log('\n✨ Sync complete!\n');
}

async function main() {
  const listings = await fetchListings();
  
  if (listings.length > 0) {
    await syncListings(listings);
  } else {
    console.log('⚠️  No listings to sync');
  }
}

// Export for GitHub Actions
export async function syncRightDrive() {
  console.log('🚗 Starting Right Drive Auto sync...');
  const listings = await fetchListings();
  
  if (listings.length > 0) {
    await syncListings(listings);
  } else {
    console.log('⚠️  No listings to sync');
  }
}

// Run directly if not imported
if (require.main === module) {
  main().catch(console.error);
}
