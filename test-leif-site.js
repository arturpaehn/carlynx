const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Opening page...');
  await page.goto('https://www.iwanttobuyused.com/', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('Page loaded, waiting 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'leif-check.png', fullPage: true });
  
  const html = await page.content();
  console.log('HTML length:', html.length);
  
  const hasResultDiv = await page.$('#result');
  console.log('Result div:', hasResultDiv ? 'FOUND' : 'NOT FOUND');
  
  const children = await page.evaluate(() => {
    const resultDiv = document.querySelector('#result');
    return resultDiv ? resultDiv.children.length : 0;
  });
  console.log('Children count:', children);
  
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);
  
  // Check if blocked
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('blocked') || bodyText.includes('captcha') || bodyText.includes('forbidden')) {
    console.log('⚠️ POSSIBLE BLOCKING DETECTED!');
  }
  
  console.log('\nFirst 500 chars of body text:');
  console.log(bodyText.substring(0, 500));
  
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
