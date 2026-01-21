const puppeteer = require('puppeteer');

const inspect = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Loading AutoNation page...');
    await page.goto(
      'https://www.autonationusa.com/used/Chevrolet/inventory?start=0',
      { waitUntil: 'networkidle2', timeout: 30000 }
    );

    // Ждём загрузки карточек
    await page.waitForSelector('[class*="vehicle"]', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Выводим HTML первой карточки
    const html = await page.evaluate(() => {
      // Ищем все элементы которые содержат информацию об авто
      const allElements = document.querySelectorAll('[class*="card"], [class*="listing"], [class*="item"], [class*="vehicle"]');
      console.log('Total elements found:', allElements.length);
      
      // Выводим структуру первых нескольких
      for (let i = 0; i < Math.min(3, allElements.length); i++) {
        const el = allElements[i];
        console.log(`\n=== Element ${i} (${el.className}) ===`);
        console.log('HTML:', el.outerHTML.substring(0, 2000));
        console.log('Text content:', el.textContent?.substring(0, 500));
      }
      
      return {
        totalFound: allElements.length,
        firstElementClass: allElements[0]?.className,
        firstElementHTML: allElements[0]?.outerHTML.substring(0, 3000)
      };
    });

    console.log('\n=== Summary ===');
    console.log('Total elements:', html.totalFound);
    console.log('First element class:', html.firstElementClass);
    console.log('\nFirst element HTML (first 2000 chars):');
    console.log(html.firstElementHTML);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
};

inspect();
