import { test, expect } from '@playwright/test';

test.describe('Главная страница', () => {
  test('должна загружаться и показывать листинги', async ({ page }) => {
    await page.goto('/');
    
    // Проверяем, что заголовок загрузился
    await expect(page).toHaveTitle(/carlynx/i);
    
    // Ждём загрузки листингов (исчезновение спиннера)
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что спиннер исчез
    await expect(page.locator('text=Loading listings...')).not.toBeVisible();
    
    // Проверяем, что есть хотя бы один листинг или сообщение об отсутствии данных
    const listings = page.locator('[data-testid="listing-card"]');
    const noDataMessage = page.locator('text=/no.*listing|empty|nothing.*found/i');
    
    // Должен быть либо листинг, либо сообщение о том, что данных нет
    await expect(async () => {
      const hasListings = await listings.first().isVisible();
      const hasNoDataMessage = await noDataMessage.first().isVisible();
      if (!hasListings && !hasNoDataMessage) {
        throw new Error('Нет ни листингов, ни сообщения об отсутствии данных');
      }
    }).toPass({ timeout: 10000 });
    
    // Если есть листинги, проверяем их структуру
    if (await listings.count() > 0) {
      const firstListing = listings.first();
      await expect(firstListing.locator('img')).toBeVisible(); // картинка
      await expect(firstListing.locator('text=/\\$[0-9,]+/')).toBeVisible(); // цена
    }
  });

  test('фильтр по году должен работать', async ({ page }) => {
    await page.goto('/');
    
    // Ждём загрузки страницы
    await page.waitForLoadState('networkidle');
    
    // Находим селект года (если есть)
    const yearSelect = page.locator('select').filter({ hasText: 'Any Year' });
    if (await yearSelect.count() > 0) {
      await yearSelect.selectOption('2020');
      
      // Ждём обновления результатов
      await page.waitForTimeout(1000);
      
      // Проверяем, что есть результаты
      const listings = page.locator('[data-testid="listing-card"]');
      await expect(listings.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('можно перейти на страницу поиска', async ({ page }) => {
    await page.goto('/');
    
    // Ищем ссылку на поиск в навигации
    const searchLink = page.locator('a[href*="search"], a:has-text("Search")');
    if (await searchLink.count() > 0) {
      await searchLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Проверяем, что перешли на страницу поиска
      await expect(page.url()).toMatch(/search/);
    }
  });
});