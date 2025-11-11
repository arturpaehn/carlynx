const puppeteer = require('puppeteer');

async function debugPage() {
  console.log('🔍 Analyzing Auto Boutique detail page structure...\n');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Try different listing URLs to check photo count
  const testUrls = [
    'https://www.autoboutiquetexas.com/vehicle-details/used-2021-toyota-corolla-le-5yfepmae8mp214314',
    'https://www.autoboutiquetexas.com/vehicle-details/used-2022-kia-k5-ex-5xxg74j29ng241606',
    'https://www.autoboutiquetexas.com/vehicle-details/used-2023-honda-civic-sport-19xfl1h7xpe039823'
  ];
  
  for (const testUrl of testUrls) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 Opening: ${testUrl}\n`);
    
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for photo gallery/slider elements
    const galleryInfo = await page.evaluate(() => {
      // Look for common gallery patterns
      const patterns = {
        photoCount: document.querySelectorAll('[class*="photoCount"]'),
        slider: document.querySelectorAll('[class*="slider"], [class*="carousel"], [class*="gallery"]'),
        thumbs: document.querySelectorAll('[class*="thumb"]'),
        allVehicleImages: Array.from(document.querySelectorAll('img')).filter(img => {
          const src = img.src || '';
          return src.includes('overfuel.com/photos/') && !src.includes('-thumb.');
        })
      };
      
      return {
        photoCountElements: patterns.photoCount.length,
        sliderElements: patterns.slider.length,
        thumbElements: patterns.thumbs.length,
        vehicleImages: patterns.allVehicleImages.length,
        vehicleImageUrls: patterns.allVehicleImages.map(img => ({
          src: img.src.substring(0, 150),
          width: img.width,
          height: img.height,
          className: img.className
        }))
      };
    });
    
    console.log(`Gallery Analysis:`);
    console.log(`  photoCount elements: ${galleryInfo.photoCountElements}`);
    console.log(`  slider/carousel elements: ${galleryInfo.sliderElements}`);
    console.log(`  thumb elements: ${galleryInfo.thumbElements}`);
    console.log(`  vehicle images (overfuel.com/photos, full-size): ${galleryInfo.vehicleImages}\n`);
    
    if (galleryInfo.vehicleImages > 0) {
      console.log(`Vehicle Images Found:`);
      galleryInfo.vehicleImageUrls.forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.width}x${img.height} - ${img.src}`);
      });
    }
  }
  
  // Keep browser open for manual inspection
  console.log('Browser is open for manual inspection. Press Ctrl+C to close.');
  await new Promise(() => {}); // Keep running
}

debugPage().catch(console.error);
