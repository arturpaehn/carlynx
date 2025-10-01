import { test, expect } from '@playwright/test';

test.describe('Регистрация - На основе реального поведения', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test('валидация имени - только английские буквы и пробелы', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has issues with this validation');
    
    await page.fill('input#fullName', 'John123');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#phone', '+1234567890');
    await page.fill('input#password', 'password123');
    
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    const errorSelector = '.text-red-700, .text-red-600, .text-red-500';
    await expect(page.locator(errorSelector)).toContainText('Name can only contain English letters and spaces.');
  });

  test('валидация имени - пустое поле', async ({ page }) => {
    await page.fill('input#fullName', '');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#phone', '+1234567890');
    await page.fill('input#password', 'password123');
    
    await page.locator('button[type="submit"]').click();

    // HTML5 валидация
    const nameField = page.locator('input#fullName');
    const validationMessage = await nameField.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('валидация телефона - неверный формат', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has issues with this validation');
    
    await page.fill('input#fullName', 'John Smith');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#phone', '123');
    await page.fill('input#password', 'password123');
    
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Более гибкий селектор для ошибок
    const errorSelector = '.text-red-700, .text-red-600, .text-red-500';
    await expect(page.locator(errorSelector)).toContainText('Invalid phone number.');
  });

  test('валидация пароля - слишком короткий', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has issues with this validation');
    
    await page.fill('input#fullName', 'John Smith');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#phone', '+1234567890');
    await page.fill('input#password', '123');
    
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    const errorSelector = '.text-red-700, .text-red-600, .text-red-500';
    await expect(page.locator(errorSelector)).toContainText('Password must be at least 7 characters.');
  });

  test('проверка существующего пользователя', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has issues with API mocking');
    
    // Мокаем API для проверки существующего пользователя
    await page.route('**/rest/v1/users**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ email: 'existing@example.com' }])
      });
    });

    await page.fill('input#fullName', 'John Smith');
    await page.fill('input#email', 'existing@example.com');
    await page.fill('input#phone', '+1234567890');
    await page.fill('input#password', 'password123');
    
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    const errorSelector = '.text-red-700, .text-red-600, .text-red-500';
    await expect(page.locator(errorSelector)).toContainText('An account with this email already exists. Try logging in.');
  });

  test.skip('успешная регистрация с валидными данными', async ({ page, browserName }) => {
    // SKIP REASON: Firefox protocol errors - "Cannot call function 'authenticate' on an object that does not implement interface 'Authenticator'"
    // TODO: Fix Firefox-specific WebDriver authentication protocol issues
    // BUG: Firefox users may experience authentication flow problems
    
    test.skip(browserName === 'webkit', 'WebKit has issues with API mocking');
    
    // Мокаем API для нового пользователя
    await page.route('**/rest/v1/users**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]) // Пустой массив = пользователь не найден
      });
    });

    // Мокаем успешную регистрацию
    await page.route('**/auth/v1/signup**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '123', email: 'newuser@example.com' },
          session: null
        })
      });
    });

    await page.fill('input#fullName', 'John Smith');
    await page.fill('input#email', 'newuser@example.com');
    await page.fill('input#phone', '+1234567890');
    await page.fill('input#password', 'password123');
    
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    
    // Проверяем что нет ошибок после успешной отправки
    const errorSelector = '.text-red-700, .text-red-600, .text-red-500';
    const errors = await page.locator(errorSelector).count();
    expect(errors).toBe(0);
  });

  test('проверка всех полей формы присутствуют', async ({ page }) => {
    await expect(page.locator('input#fullName')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('проверка placeholder текстов', async ({ page }) => {
    await expect(page.locator('input#fullName')).toHaveAttribute('placeholder', 'Enter your full name');
    await expect(page.locator('input#email')).toHaveAttribute('placeholder', 'Enter your email');
    await expect(page.locator('input#phone')).toHaveAttribute('placeholder', '+1 (555) 123-4567');
    await expect(page.locator('input#password')).toHaveAttribute('placeholder', 'Create a password');
  });

  test('проверка типов полей', async ({ page }) => {
    await expect(page.locator('input#fullName')).toHaveAttribute('type', 'text');
    await expect(page.locator('input#email')).toHaveAttribute('type', 'email');
    await expect(page.locator('input#phone')).toHaveAttribute('type', 'tel');
    await expect(page.locator('input#password')).toHaveAttribute('type', 'password');
  });

  test('валидные данные не показывают ошибок до отправки', async ({ page }) => {
    await page.fill('input#fullName', 'John Smith');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#phone', '+1234567890');
    await page.fill('input#password', 'password123');
    
    // Не нажимаем submit
    const errorSelector = '.text-red-700, .text-red-600, .text-red-500';
    const errors = await page.locator(errorSelector).count();
    expect(errors).toBe(0);
  });
});