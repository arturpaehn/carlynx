const puppeteer = require('puppeteer');

const testSelectors = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Loading AutoNation Corpus Christi page...');
    await page.goto(
      'https://www.autonationusa.com/used-cars/corpus-christi.htm?geoRadius=0',
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Scroll чтобы загрузились элементы
    await page.evaluate(async () => {
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
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Проверяем селекторы
    const results = await page.evaluate(() => {
      return {
        totalCards: document.querySelectorAll('.vehicle-card').length,
        cardsWithTitle: document.querySelectorAll('.vehicle-card-title a span').length,
        cardsWithPrice: document.querySelectorAll('.price-value').length,
        cardsWithMileage: document.querySelectorAll('.highlight-badge').length,
        cardsWithVin: document.querySelectorAll('[tru-button-vin]').length,
        cardsWithLink: document.querySelectorAll('a[href*="/used/"]').length,
        
        // Выводим первую карточку для инспекции
        firstCard: {
          html: document.querySelector('.vehicle-card')?.outerHTML.substring(0, 1500) || 'NOT FOUND',
          titleText: document.querySelector('.vehicle-card-title a span')?.textContent || 'NOT FOUND',
          priceText: document.querySelector('.price-value')?.textContent || 'NOT FOUND',
          mileageText: document.querySelector('.highlight-badge')?.textContent || 'NOT FOUND',
          vin: document.querySelector('[tru-button-vin]')?.getAttribute('tru-button-vin') || 'NOT FOUND',
          link: document.querySelector('a[href*="/used/"]')?.getAttribute('href') || 'NOT FOUND'
        }
      };
    });

    console.log('\n=== СЕЛЕКТОРЫ ===');
    console.log(`✓ .vehicle-card найдено: ${results.totalCards}`);
    console.log(`✓ .vehicle-card-title a span найдено: ${results.cardsWithTitle}`);
    console.log(`✓ .price-value найдено: ${results.cardsWithPrice}`);
    console.log(`✓ .highlight-badge найдено: ${results.cardsWithMileage}`);
    console.log(`✓ [tru-button-vin] найдено: ${results.cardsWithVin}`);
    console.log(`✓ a[href*="/used/"] найдено: ${results.cardsWithLink}`);

    console.log('\n=== ПЕРВАЯ КАРТОЧКА ===');
    console.log('Title:', results.firstCard.titleText);
    console.log('Price:', results.firstCard.priceText);
    console.log('Mileage:', results.firstCard.mileageText);
    console.log('VIN:', results.firstCard.vin);
    console.log('Link:', results.firstCard.link);
    console.log('\nHTML (first 1500 chars):');
    console.log(results.firstCard.html);

    // Проверка: все ли селекторы нашли что-то
    const allWorking = results.totalCards > 0 && results.cardsWithTitle > 0 && 
                       results.cardsWithPrice > 0 && results.cardsWithMileage > 0;
    
    console.log('\n=== ИТОГ ===');
    if (allWorking) {
      console.log('✅ ВСЕ СЕЛЕКТОРЫ РАБОТАЮТ');
    } else {
      console.log('❌ СЕЛЕКТОРЫ НЕ РАБОТАЮТ - нужны новые');
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await browser.close();
  }
};

testSelectors();
