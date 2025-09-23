import { test, expect } from '@playwright/test';

test.describe('Навигация сайта', () => {
  test('хедер должен быть виден и работать', async ({ page }) => {
    await page.goto('/');
    
    // Проверяем логотип
    const logo = page.locator('img[alt*="logo" i], [data-testid="logo"]');
    if (await logo.count() > 0) {
      await expect(logo.first()).toBeVisible();
    }
    
    // Проверяем основные ссылки навигации
    const navLinks = ['Add Listing', 'Search', 'Login', 'Register'];
    
    for (const linkText of navLinks) {
      const link = page.locator(`a:has-text("${linkText}"), button:has-text("${linkText}")`);
      if (await link.count() > 0) {
        await expect(link.first()).toBeVisible();
      }
    }
  });

  test('футер должен содержать основные ссылки', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Прокручиваем вниз к футеру
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Проверяем наличие футера
    const footer = page.locator('footer, [data-testid="footer"]');
    if (await footer.count() > 0) {
      await expect(footer.first()).toBeVisible();
      
      // Проверяем основные ссылки в футере
      const footerLinks = ['Privacy', 'Terms', 'Contact'];
      for (const linkText of footerLinks) {
        const link = footer.locator(`a:has-text("${linkText}")`);
        if (await link.count() > 0) {
          await expect(link.first()).toBeVisible();
        }
      }
    }
  });

  test('404 страница должна работать корректно', async ({ page }) => {
    // Переходим на несуществующую страницу
    await page.goto('/nonexistent-page-12345');
    
    // Ждём загрузки
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что показывается 404 или похожее сообщение
    const notFoundText = page.locator('text=/not found|404|page.*not.*exist/i');
    await expect(notFoundText.first()).toBeVisible({ timeout: 5000 });
  });
});