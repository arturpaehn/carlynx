import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function inspectHTML() {
  console.log('🔍 Inspecting Mars Dealership HTML structure...\n');
  
  try {
    const response = await fetch('https://marsdealership.com/listings/');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find all potential listing containers
    const containers = [
      '.listing-card',
      '.vehicle-card', 
      '[class*="listing"]',
      '[class*="vehicle"]',
      'article',
      '.car-item',
      '.inventory-item'
    ];
    
    console.log('📦 Looking for listing containers...\n');
    
    containers.forEach(selector => {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`✅ Found ${count} elements with selector: ${selector}`);
        
        // Show first element's HTML
        const first = $(selector).first();
        const classes = first.attr('class');
        console.log(`   Classes: ${classes || 'none'}`);
        console.log(`   Sample HTML (first 500 chars):`);
        console.log(`   ${first.html()?.substring(0, 500)}...\n`);
      }
    });
    
    // Look for specific data elements
    console.log('\n🔎 Looking for specific data elements...\n');
    
    const dataSelectors = {
      'Title': ['h1', 'h2', 'h3', '.title', '[class*="title"]'],
      'Price': ['.price', '[class*="price"]'],
      'Year': ['.year', '[class*="year"]'],
      'Mileage': ['.mileage', '[class*="mile"]', '[class*="odometer"]'],
      'Image': ['img'],
      'Link': ['a[href*="listing"]', 'a[href*="vehicle"]', 'a[href*="detail"]']
    };
    
    Object.entries(dataSelectors).forEach(([name, selectors]) => {
      console.log(`${name}:`);
      selectors.forEach(sel => {
        const count = $(sel).length;
        if (count > 0) {
          const sample = $(sel).first().text().trim().substring(0, 100);
          console.log(`  ✓ ${sel} (${count} found) - Sample: "${sample}"`);
        }
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

inspectHTML().catch(console.error);
