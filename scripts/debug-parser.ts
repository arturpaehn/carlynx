import * as cheerio from 'cheerio';

async function debug() {
  const response = await fetch('https://marsdealership.com/listings/');
  const html = await response.text();
  const $ = cheerio.load(html);
  
  console.log('🔍 Checking article elements...\n');
  
  $('article').each((i, el) => {
    if (i < 3) { // Show first 3
      const $el = $(el);
      const classes = $el.attr('class');
      console.log(`Article ${i + 1}:`);
      console.log(`  Classes: ${classes}`);
      console.log(`  Has .listing-item: ${$el.hasClass('listing-item')}`);
      console.log(`  Title: ${$el.find('h3.listing-title a').text().trim()}`);
      console.log(`  Link: ${$el.find('a.listing-image').attr('href')}`);
      console.log(`  Price: ${$el.find('.listing-price .price-value').text().trim()}`);
      console.log(`  Image src: ${$el.find('.listing-image img').attr('src')}`);
      console.log('');
    }
  });
  
  console.log(`Total articles: ${$('article').length}`);
}

debug();
