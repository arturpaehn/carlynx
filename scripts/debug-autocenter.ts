import puppeteer from 'puppeteer';

async function debugPage() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.autocenteroftexas.com/used-vehicles-terrell-tx?limit=50', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('Waiting 10 seconds for content...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const debug = await page.evaluate(() => {
    // Look for vehicle detail links
    const vehicleDetailLinks = Array.from(document.querySelectorAll('a[href*="/vehicle-details/"]'));
    console.log(`Found ${vehicleDetailLinks.length} vehicle-details links`);
    
    // Also search for any links with "used-" in href
    const usedLinks = Array.from(document.querySelectorAll('a[href*="used-"]'));
    console.log(`Found ${usedLinks.length} used- links`);
    
    // Get samples
    const samples = vehicleDetailLinks.slice(0, 3).map(a => ({
      href: (a as HTMLAnchorElement).href,
      text: a.textContent?.trim().substring(0, 100)
    }));
    
    // Alternative: search in body HTML directly
    const bodyHTML = document.body.innerHTML;
    const hasVehicleDetails = bodyHTML.includes('/vehicle-details/');
    const hasUsedLinks = bodyHTML.includes('used-20');
    
    return {
      vehicleDetailLinksCount: vehicleDetailLinks.length,
      usedLinksCount: usedLinks.length,
      samples,
      hasVehicleDetailsInHTML: hasVehicleDetails,
      hasUsedLinksInHTML: hasUsedLinks,
      bodyLength: bodyHTML.length
    };
  });
  
  console.log('Debug info:', JSON.stringify(debug, null, 2));
  
  await browser.close();
}

debugPage().catch(console.error);
