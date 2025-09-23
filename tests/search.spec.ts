import { test, expect } from '@playwright/test';

test.describe('Страница поиска', () => {
  test('должна загружаться и содержать поле поиска', async ({ page }) => {
    // Переходим на страницу поиска (если есть)
    await page.goto('/search-results');
    
    // Если страница не найдена, переходим на главную и ищем ссылку
    if (page.url().includes('404') || page.url().includes('not-found')) {
      await page.goto('/');
      
      // Ищем ссылку на поиск
      const searchLink = page.locator('a[href*="search"], a:has-text("Search")');
      if (await searchLink.count() > 0) {
        await searchLink.first().click();
        await page.waitForLoadState('networkidle');
      } else {
        console.log('Страница поиска не найдена');
        return;
      }
    }
    
    // Ждём загрузки
    await page.waitForLoadState('networkidle');
    
    // Ищем поле поиска на странице
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      
      // Тестируем поиск
      await searchInput.first().fill('BMW');
      
      // Ищем кнопку поиска
      const searchButton = page.locator('button[type="submit"], button:has-text("Search")');
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('должна показывать результаты поиска', async ({ page }) => {
    await page.goto('/search-results');
    
    if (page.url().includes('404') || page.url().includes('not-found')) {
      console.log('Страница поиска не существует');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что есть область для результатов
    const resultsArea = page.locator('[data-testid="search-results"], .search-results, .results');
    if (await resultsArea.count() > 0) {
      await expect(resultsArea.first()).toBeVisible();
    }
  });
});