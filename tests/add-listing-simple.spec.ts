import { test, expect } from '@playwright/test';

test.describe('Add Listing Page - Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/add-listing');
    await page.waitForLoadState('networkidle');
  });

  test('should display the add listing page', async ({ page }) => {
    await expect(page.locator('h2:has-text("Add New Listing")')).toBeVisible();
    await expect(page.locator('text=Sell your car to thousands of potential buyers')).toBeVisible();
    await expect(page.locator('button:has-text("Create Listing")')).toBeVisible();
  });

  test('should have vehicle type selection', async ({ page }) => {
    const carButton = page.locator('button:has-text("Car")');
    const motorcycleButton = page.locator('button:has-text("Motorcycle")');
    
    await expect(carButton).toBeVisible();
    await expect(motorcycleButton).toBeVisible();
    await expect(carButton).toHaveClass(/border-orange-500/);
  });

  test('should switch between car and motorcycle', async ({ page }) => {
    const motorcycleButton = page.locator('button:has-text("Motorcycle")');
    await motorcycleButton.click();
    await page.waitForTimeout(500);
    
    await expect(motorcycleButton).toHaveClass(/border-orange-500/);
    await expect(page.locator('label:has-text("Motorcycle Brand")')).toBeVisible();
  });

  test('should have required form fields', async ({ page }) => {
    await expect(page.locator('input[id="brand"]')).toBeVisible();
    await expect(page.locator('input[id="price"]')).toBeVisible();
    await expect(page.locator('input[id="year"]')).toBeVisible();
    await expect(page.locator('select[id="state"]')).toBeVisible();
    
    await expect(page.locator('input[id="brand"]')).toHaveAttribute('required');
    await expect(page.locator('input[id="price"]')).toHaveAttribute('required');
    await expect(page.locator('input[id="year"]')).toHaveAttribute('required');
    await expect(page.locator('select[id="state"]')).toHaveAttribute('required');
  });

  test('should show transmission field only for cars', async ({ page }) => {
    await expect(page.locator('select[id="transmission"]')).toBeVisible();
    
    await page.locator('button:has-text("Motorcycle")').click();
    await page.waitForTimeout(500);
    
    await expect(page.locator('select[id="transmission"]')).not.toBeVisible();
  });

  test('should show city field when state is selected', async ({ page }) => {
    await expect(page.locator('input[id="city"]')).not.toBeVisible();
    
    await page.selectOption('select[id="state"]', { index: 1 });
    await page.waitForTimeout(1000);
    
    await expect(page.locator('input[id="city"]')).toBeVisible();
  });

  test('should have image upload functionality', async ({ page }) => {
    // Input скрыт, но кнопка видна
    await expect(page.locator('input[type="file"]')).toBeAttached();
    await expect(page.locator('text=Upload photos')).toBeVisible();
    await expect(page.locator('text=0/4 images')).toBeVisible();
  });

  test('should have contact preferences', async ({ page }) => {
    const phoneCheckbox = page.locator('input[type="checkbox"]:near(:text("phone"))');
    const emailCheckbox = page.locator('input[type="checkbox"]:near(:text("email"))');
    
    await expect(phoneCheckbox).toBeVisible();
    await expect(emailCheckbox).toBeVisible();
    await expect(phoneCheckbox).toBeChecked();
    await expect(emailCheckbox).not.toBeChecked();
  });

  test('should fill form with valid data', async ({ page }) => {
    await page.fill('input[id="brand"]', 'Toyota');
    await page.fill('input[id="price"]', '25000');
    await page.fill('input[id="year"]', '2020');
    await page.selectOption('select[id="state"]', { index: 1 });
    await page.selectOption('select[id="transmission"]', 'automatic');
    
    // Проверяем заполненные поля
    await expect(page.locator('input[id="price"]')).toHaveValue('25000');
    await expect(page.locator('input[id="year"]')).toHaveValue('2020');
  });

  test('should validate price input accepts numbers only', async ({ page }) => {
    const priceInput = page.locator('input[id="price"]');
    
    // Проверяем тип поля
    await expect(priceInput).toHaveAttribute('type', 'number');
    await expect(priceInput).toHaveAttribute('placeholder', 'Enter price');
    
    // Пробуем заполнить число
    await priceInput.click();
    await priceInput.fill('15000');
  });

  test('should show different engine size fields for vehicles', async ({ page }) => {
    // Для автомобилей - два поля 
    await expect(page.locator('input[placeholder="2"]')).toBeVisible();
    await expect(page.locator('input[placeholder="0"]')).toBeVisible();
    
    await page.locator('button:has-text("Motorcycle")').click();
    await page.waitForTimeout(500);
    
    // Для мотоциклов - одно поле в cc
    await expect(page.locator('input[placeholder="e.g. 600"]')).toBeVisible();
    await expect(page.locator('input[placeholder="2"]')).not.toBeVisible();
  });

  test('should handle vehicle type switching', async ({ page }) => {
    const carButton = page.locator('button').filter({ hasText: 'Car' });
    const motorcycleButton = page.locator('button').filter({ hasText: 'Motorcycle' });
    
    // Проверяем что car выбран по умолчанию
    await expect(carButton).toHaveClass(/border-orange-500/);
    
    // Переключаемся на motorcycle
    await motorcycleButton.click();
    await page.waitForTimeout(500);
    
    await expect(motorcycleButton).toHaveClass(/border-orange-500/);
    await expect(carButton).not.toHaveClass(/border-orange-500/);
  });

  test('should load and display states in dropdown', async ({ page }) => {
    const stateSelect = page.locator('select[id="state"]');
    await expect(stateSelect).toBeVisible();
    
    // Проверяем что есть хотя бы placeholder
    const options = stateSelect.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(1); // Минимум placeholder
    
    // Проверяем placeholder текст
    await expect(stateSelect.locator('option').first()).toHaveText('Select state');
  });

  test('should show city input after state selection', async ({ page }) => {
    const stateSelect = page.locator('select[id="state"]');
    const cityInput = page.locator('input[id="city"]');
    
    // Ждем загрузки штатов и выбираем первый доступный
    await page.waitForTimeout(2000);
    await stateSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    
    // Проверяем что появилось поле для города
    await expect(cityInput).toBeVisible();
    await expect(cityInput).toHaveAttribute('placeholder', 'Start typing city name');
  });

  test('should validate required fields before submission', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    
    // Попытка отправить пустую форму
    await submitButton.click();
    
    // Проверяем что страница не перенаправила (остались на той же странице)
    await expect(page).toHaveURL(/add-listing/);
    
    // HTML5 валидация должна сработать для required полей
    const brandInput = page.locator('input[id="brand"]');
    const isInvalid = await brandInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});