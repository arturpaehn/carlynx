import puppeteer, { Browser } from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VehicleData {
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
  engine_size: string | null;
  vehicle_type: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
  vin: string | null;
  contact_phone: string;
  contact_email: string | null;
  city_name: string;
  state_id: number | null;
  city_id: number | null;
}

async function getLocationIds(): Promise<{ stateId: number; cityId: number }> {
  const stateName = 'Texas';
  const cityName = 'Corpus Christi';

  const { data: stateData } = await supabase
    .from('states')
    .select('id')
    .eq('name', stateName)
    .single();

  if (!stateData) {
    throw new Error(`State ${stateName} not found`);
  }

  const { data: cityData } = await supabase
    .from('cities')
    .select('id')
    .eq('name', cityName)
    .eq('state_id', stateData.id)
    .single();

  if (!cityData) {
    throw new Error(`City ${cityName} not found`);
  }

  return { stateId: stateData.id, cityId: cityData.id };
}

function normalizeTransmission(transmission: string | null): string | null {
  if (!transmission) return null;
  const t = transmission.toLowerCase();
  if (t.includes('automatic') || t.includes('auto') || t.includes('a/t')) return 'Automatic';
  if (t.includes('manual')) return 'Manual';
  if (t.includes('cvt')) return 'CVT';
  return transmission;
}

async function fetchDetailPageData(detailUrl: string, browser: Browser): Promise<{ transmission: string | null; engine_size: string | null }> {
  const page = await browser.newPage();
  const DETAIL_PAGE_TIMEOUT = 20000; // 20 seconds per detail page
  try {
    const fullUrl = detailUrl.startsWith('http') ? detailUrl : `https://www.autonationusa.com${detailUrl}`;
    
    await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: DETAIL_PAGE_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const detailData = await page.evaluate(() => {
      let transmission = null;
      let engineSize = null;

      // Look for DT/DD pairs
      const dtElements = document.querySelectorAll('dt');
      dtElements.forEach(dt => {
        const label = dt.textContent?.trim().toLowerCase() || '';
        const dd = dt.nextElementSibling;
        const value = dd?.textContent?.trim() || '';

        if (label === 'transmission' && value) {
          transmission = value;
        }
        
        if (label === 'engine' && value) {
          // Extract engine displacement: "5.3 Liter VVT" -> "5.3"
          const match = value.match(/([\d.]+)\s*[Ll]/);
          if (match) {
            engineSize = match[1];
          }
        }
      });

      // If engine size not found in DT/DD, check spec items
      if (!engineSize) {
        const specItems = document.querySelectorAll('.spec-item');
        specItems.forEach(item => {
          const text = item.textContent || '';
          if (text.toLowerCase().includes('engine displacement:')) {
            const match = text.match(/([\d.]+)\s*[Ll]/);
            if (match) {
              engineSize = match[1];
            }
          }
        });
      }

      return { transmission, engineSize };
    });

    await page.close();
    
    return {
      transmission: normalizeTransmission(detailData.transmission),
      engine_size: detailData.engineSize
    };
  } catch (error) {
    console.error(`  ✗ Error fetching detail page: ${error}`);
    await page.close();
    return { transmission: null, engine_size: null };
  }
}

async function fetchListings(): Promise<VehicleData[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process=false',
      '--memory-pressure-off'
    ]
  });

  const vehicles: VehicleData[] = [];
  const baseUrl = 'https://www.autonationusa.com/used-cars/corpus-christi.htm?geoRadius=0';
  const vehiclesPerPage = 18;

  try {
    // Определяем количество страниц
    const firstPage = await browser.newPage();
    await firstPage.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Находим максимальную страницу из пагинации
    const paginationLinks = await firstPage.$$eval('.pagination a', links => 
      links
        .map(a => a.getAttribute('href'))
        .filter((href): href is string => href !== null && href.includes('start='))
        .map(href => {
          const match = href.match(/start=(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
    );

    const maxStart = Math.max(...paginationLinks, 0);
    const totalPages = Math.ceil(maxStart / vehiclesPerPage) + 1;
    
    // ТЕСТОВЫЙ РЕЖИМ: только первая страница
    const testMode = false;
    const pagesToParse = testMode ? 1 : totalPages;
    
    console.log(`Found ${totalPages} pages total`);
    if (testMode) {
      console.log(`TEST MODE: Parsing only ${pagesToParse} page(s)`);
    }
    await firstPage.close();

    // Парсим каждую страницу
    for (let pageNum = 0; pageNum < pagesToParse; pageNum++) {
      const start = pageNum * vehiclesPerPage;
      const url = pageNum === 0 ? baseUrl : `${baseUrl}&start=${start}`;
      
      console.log(`\nParsing page ${pageNum + 1}/${totalPages}: ${url}`);
      
      const page = await browser.newPage();
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Ждём загрузки карточек
        await page.waitForSelector('.vehicle-card', { timeout: 10000 });
        
        // Ждём пока загрузятся JavaScript данные (evs_link)
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Скроллим страницу чтобы все изображения и данные загрузились
        // ЗАЩИТА: используем Promise.race чтобы не зависнуть навечно
        try {
          await Promise.race([
            page.evaluate(async () => {
              await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                  window.scrollBy(0, distance);
                  totalHeight += distance;
                  if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve(null);
                  }
                }, 100);
              });
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Scroll timeout exceeded 5 seconds')), 5000)
            )
          ]);
        } catch (scrollError) {
          // Scroll не завершился за 5 сек, но это не критично - продолжаем парсинг
          const errMsg = scrollError instanceof Error ? scrollError.message : 'Unknown scroll error';
          console.log(`  ⚠️  Scroll warning: ${errMsg} - continuing anyway`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Извлекаем данные о каждом автомобиле
        const pageVehicles = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.vehicle-card'));
          
          return cards
            .filter(card => {
              // Пропускаем только placeholder карточки
              return !card.classList.contains('placeholder-card');
            })
            .map(card => {
              // Извлекаем VIN из tru-button-vin
              const truButton = card.querySelector('[tru-button-vin]');
              const vin = truButton?.getAttribute('tru-button-vin') || null;

              // Извлекаем заголовок (содержит год, марку, модель)
              const titleElement = card.querySelector('.vehicle-card-title a span');
              const titleText = titleElement?.textContent?.trim() || '';
              
              // Парсим заголовок: "2019 Toyota Camry SE"
              const titleMatch = titleText.match(/^(\d{4})\s+([A-Za-z\-]+)\s+(.+)$/);
              const year = titleMatch ? parseInt(titleMatch[1]) : null;
              const make = titleMatch ? titleMatch[2] : null;
              const model = titleMatch ? titleMatch[3] : null;

              // Извлекаем цену
              const priceElement = card.querySelector('.price-value');
              const priceText = priceElement?.textContent?.replace(/[^0-9]/g, '') || null;
              const price = priceText ? parseInt(priceText) : null;

              // Извлекаем пробег
              const mileageElement = card.querySelector('.highlight-badge');
              const mileageText = mileageElement?.textContent?.replace(/[^0-9]/g, '') || null;
              const mileage = mileageText ? parseInt(mileageText) : null;

              // Извлекаем URL детальной страницы
              const linkElement = card.querySelector('a[href*="/used/"]');
              const detailUrl = linkElement?.getAttribute('href') || null;

              // Извлекаем изображения
              const images: string[] = [];
              const imgElements = card.querySelectorAll('img[src*="pictures.dealer.com"]');
              imgElements.forEach((img: Element) => {
                const src = (img as HTMLImageElement).src;
                if (src && !images.includes(src)) {
                  images.push(src);
                }
              });

              // UUID карточки
              const uuid = card.getAttribute('data-uuid') || null;

              return {
                vin,
                year,
                make,
                model,
                price,
                mileage,
                detailUrl,
                images,
                uuid,
                titleText // для отладки
              };
            });
        });

        console.log(`Found ${pageVehicles.length} vehicles on page ${pageNum + 1}`);

        // ТЕСТОВЫЙ РЕЖИМ: только первые 2 машины
        const vehiclesToProcess = testMode ? pageVehicles.slice(0, 2) : pageVehicles;
        if (testMode) {
          console.log(`TEST MODE: Processing ${vehiclesToProcess.length} vehicles`);
        }

        for (const v of vehiclesToProcess) {
          if (!v.vin || !v.make || !v.model || !v.year) {
            console.log(`Skipping vehicle - missing required data:`, v);
            continue;
          }

          if (v.images.length === 0) {
            console.log(`Skipping vehicle ${v.vin} - no images`);
            continue;
          }

          const vehicleUrl = v.detailUrl 
            ? `https://www.autonationusa.com${v.detailUrl}`
            : `https://www.autonationusa.com/used-cars/corpus-christi.htm`;

          // Fetch transmission and engine_size from detail page
          let transmission = null;
          let engineSize = null;
          
          if (v.detailUrl) {
            console.log(`  Fetching details for ${v.year} ${v.make} ${v.model}...`);
            const detailData = await fetchDetailPageData(v.detailUrl, browser);
            transmission = detailData.transmission;
            engineSize = detailData.engine_size;
            
            if (!engineSize) {
              console.log(`  ⚠️  No engine size found - vehicle will be saved with null value`);
            } else {
              console.log(`  ✓ Got: transmission=${transmission}, engine_size=${engineSize}`);
            }
          } else {
            console.log(`  ⚠️  No detail URL found - vehicle will be saved without detail data`);
          }

          vehicles.push({
            external_id: v.uuid || v.vin,
            source: 'autonation_usa_corpus_christi',
            external_url: vehicleUrl,
            title: v.make, // Только марка
            brand: v.make,
            model: v.model,
            year: v.year,
            price: v.price,
            mileage: v.mileage,
            transmission: transmission,
            fuel_type: null,
            engine_size: engineSize,
            vehicle_type: null,
            image_url: v.images[0] || null,
            image_url_2: v.images[1] || null,
            image_url_3: v.images[2] || null,
            image_url_4: v.images[3] || null,
            vin: v.vin,
            contact_phone: '(361) 541-6751',
            contact_email: null,
            city_name: 'Corpus Christi',
            state_id: null,
            city_id: null
          });
        }

        await page.close();
      } catch (error) {
        console.error(`Error parsing page ${pageNum + 1}:`, error);
        await page.close();
      }
    }

  } finally {
    await browser.close();
  }

  return vehicles;
}

async function syncListings(vehicles: VehicleData[]): Promise<void> {
  const { stateId, cityId } = await getLocationIds();

  // Обновляем state_id и city_id для всех записей
  vehicles.forEach(v => {
    v.state_id = stateId;
    v.city_id = cityId;
  });

  console.log(`\nSyncing ${vehicles.length} vehicles to database...`);

  for (const vehicle of vehicles) {
    try {
      // Проверяем существование записи
      const { data: existing } = await supabase
        .from('external_listings')
        .select('id')
        .eq('external_id', vehicle.external_id)
        .eq('source', vehicle.source)
        .single();

      if (existing) {
        // Обновляем существующую запись
        const { error } = await supabase
          .from('external_listings')
          .update(vehicle)
          .eq('id', existing.id);

        if (error) {
          console.error(`Error updating vehicle ${vehicle.vin}:`, error);
        } else {
          console.log(`✓ Updated: ${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.vin})`);
        }
      } else {
        // Создаём новую запись
        const { error } = await supabase
          .from('external_listings')
          .insert([vehicle]);

        if (error) {
          console.error(`Error inserting vehicle ${vehicle.vin}:`, error);
        } else {
          console.log(`✓ Inserted: ${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.vin})`);
        }
      }
    } catch (error) {
      console.error(`Error processing vehicle ${vehicle.vin}:`, error);
    }
  }

  console.log('\nSync completed!');
}

async function main() {
  try {
    console.log('Starting AutoNation USA Corpus Christi parser...\n');
    
    const vehicles = await fetchListings();
    console.log(`\nTotal vehicles fetched: ${vehicles.length}`);

    if (vehicles.length > 0) {
      await syncListings(vehicles);
    } else {
      console.log('No vehicles to sync');
    }

  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

// Export for GitHub Actions (without test mode limit)
export async function syncAutoNationUsaCorpusChristi() {
  console.log('🚗 Starting AutoNation USA Corpus Christi sync...');
  
  try {
    const vehicles = await fetchListings();
    console.log(`\nTotal vehicles fetched: ${vehicles.length}`);

    if (vehicles.length > 0) {
      await syncListings(vehicles);
    } else {
      console.log('No vehicles to sync');
    }
  } catch (error) {
    console.error('Error in AutoNation USA sync:', error);
    throw error;
  }
}

// Run directly if not imported
if (require.main === module) {
  main();
}
