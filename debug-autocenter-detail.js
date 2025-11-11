const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://www.autocenteroftexas.com/vehicle-details/used-2010-bmw-550i-m-series-terrell-tx-id-61739720', {
    waitUntil: 'networkidle2'
  });
  
  await new Promise(r => setTimeout(r, 5000));
  
  const html = await page.content();
  fs.writeFileSync('autocenter-detail-page.html', html);
  console.log('HTML saved to autocenter-detail-page.html');
  
  // Check what images are on the page
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => ({
      src: img.src,
      alt: img.alt,
      className: img.className,
      width: img.width,
      height: img.height
    }));
  });
  
  console.log('\nImages found:');
  images.forEach((img, i) => {
    console.log(`\n${i + 1}. ${img.src}`);
    console.log(`   Alt: ${img.alt}`);
    console.log(`   Class: ${img.className}`);
    console.log(`   Size: ${img.width}x${img.height}`);
  });
  
  await browser.close();
})();
