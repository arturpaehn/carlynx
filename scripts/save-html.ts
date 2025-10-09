import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function saveHTML() {
  const response = await fetch('https://marsdealership.com/listings/');
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const firstArticle = $('article').first().html();
  fs.writeFileSync('article-sample.html', firstArticle || '', 'utf8');
  console.log('✅ Saved first article HTML to article-sample.html');
  
  // Also show structure
  console.log('\n📋 Structure of first article:\n');
  console.log(firstArticle?.substring(0, 2000));
}

saveHTML();
