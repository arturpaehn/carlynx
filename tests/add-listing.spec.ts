import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Add Listing Page', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    await page.goto('http://localhost:3000/add-listing');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should display add listing page for unauthenticated users', async () => {
    // Проверяем, что страница загружается (без принудительной аутентификации)
    await expect(page.locator('h2:has-text("Add New Listing")')).toBeVisible();
    await expect(page.locator('text=Sell your car to thousands of potential buyers')).toBeVisible();
  });

  test('should display the add listing form elements', async () => {
    // Проверяем основные элементы формы
    await expect(page.locator('h2:has-text("Add New Listing")')).toBeVisible();
    await expect(page.locator('label:has-text("Vehicle Type")')).toBeVisible();
    await expect(page.locator('label[for="brand"]')).toBeVisible();
    await expect(page.locator('label[for="price"]')).toBeVisible();
    await expect(page.locator('label[for="year"]')).toBeVisible();
    await expect(page.locator('label[for="state"]')).toBeVisible();
    await expect(page.locator('label:has-text("Photos")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Listing")')).toBeVisible();
  });

  test('should allow vehicle type selection', async () => {
    // Проверяем выбор автомобиля (по умолчанию)
    const carButton = page.locator('button:has-text("Car")');
    const motorcycleButton = page.locator('button:has-text("Motorcycle")');
    
    await expect(carButton).toHaveClass(/border-orange-500/);
    
    // Переключаемся на мотоцикл
    await motorcycleButton.click();
    await page.waitForTimeout(500); // Ждем обновления UI
    
    await expect(motorcycleButton).toHaveClass(/border-orange-500/);
    await expect(carButton).not.toHaveClass(/border-orange-500/);
    
    // Проверяем, что лейбл изменился для мотоцикла
    await expect(page.locator('label:has-text("Motorcycle Brand")')).toBeVisible();
    await expect(page.locator('label:has-text("Engine Size (cc)")')).toBeVisible();
  });

  test('should validate required fields', async () => {
    // Пытаемся отправить пустую форму
    const submitButton = page.locator('button:has-text("Create Listing")');
    await submitButton.click();

    // Проверяем HTML5 валидацию (браузер показывает встроенные сообщения)
    // Или ищем наше кастомное сообщение
    const brandInput = page.locator('input[id="brand"]');
    await expect(brandInput).toHaveAttribute('required');
    
    const priceInput = page.locator('input[id="price"]');
    await expect(priceInput).toHaveAttribute('required');
    
    const yearInput = page.locator('input[id="year"]');
    await expect(yearInput).toHaveAttribute('required');
    
    const stateSelect = page.locator('select[id="state"]');
    await expect(stateSelect).toHaveAttribute('required');
  });

  test('should show transmission field for cars', async () => {
    // Убеждаемся что тип автомобиль выбран (по умолчанию)
    const carButton = page.locator('button:has-text("Car")');
    await expect(carButton).toHaveClass(/border-orange-500/);
    
    // Проверяем что поле transmission видно для автомобилей
    await expect(page.locator('label[for="transmission"]')).toBeVisible();
    await expect(page.locator('select[id="transmission"]')).toBeVisible();
    
    // Переключаемся на мотоцикл
    const motorcycleButton = page.locator('button:has-text("Motorcycle")');
    await motorcycleButton.click();
    await page.waitForTimeout(500);
    
    // Поле transmission должно исчезнуть для мотоциклов
    await expect(page.locator('label[for="transmission"]')).not.toBeVisible();
    await expect(page.locator('select[id="transmission"]')).not.toBeVisible();
  });

  test('should require at least one image', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Заполняем все обязательные поля кроме изображений
    await authenticatedPage.fill('input[placeholder*="car brand"]', 'Honda');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '12000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '2019');
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.selectOption('select[id="transmission"]', 'automatic');
    await authenticatedPage.check('input[type="checkbox"]:near(:text("phone"))');

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    await expect(authenticatedPage.locator('text=Please upload at least one image')).toBeVisible({ timeout: 10000 });
  });

  test('should require at least one contact method', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Заполняем все обязательные поля
    await authenticatedPage.fill('input[placeholder*="car brand"]', 'Ford');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '18000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '2021');
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.selectOption('select[id="transmission"]', 'manual');
    
    // Создаем фиктивный файл для тестирования
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const buffer = Buffer.from('fake image data');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    // Убираем все методы контакта
    await authenticatedPage.uncheck('input[type="checkbox"]:near(:text("phone"))');
    await authenticatedPage.uncheck('input[type="checkbox"]:near(:text("email"))');

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    await expect(authenticatedPage.locator('text=Please select at least one contact method')).toBeVisible({ timeout: 10000 });
  });

  test('should validate year range', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Заполняем поля с неверным годом
    await authenticatedPage.fill('input[placeholder*="car brand"]', 'Chevrolet');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '25000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '1800'); // Неверный год
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.selectOption('select[id="transmission"]', 'automatic');
    await authenticatedPage.check('input[type="checkbox"]:near(:text("phone"))');
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const buffer = Buffer.from('fake image data');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    await expect(authenticatedPage.locator('text=Year must be between 1900 and')).toBeVisible({ timeout: 10000 });
  });

  test('should validate motorcycle engine size', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Выбираем мотоцикл
    await authenticatedPage.locator('button:has-text("Motorcycle")').click();
    
    // Заполняем поля
    await authenticatedPage.fill('input[placeholder*="motorcycle brand"]', 'Harley-Davidson');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '15000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '2020');
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.fill('input[placeholder="e.g. 600"]', '5000'); // Слишком большой объем
    await authenticatedPage.check('input[type="checkbox"]:near(:text("phone"))');
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const buffer = Buffer.from('fake image data');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    await expect(authenticatedPage.locator('text=Engine size must be between 50 and 3000 cc for motorcycles')).toBeVisible({ timeout: 10000 });
  });

  test('should detect harmful content in description', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Заполняем все поля корректно, но добавляем неподходящий контент в описание
    await authenticatedPage.fill('input[placeholder*="car brand"]', 'BMW');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '30000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '2022');
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.selectOption('select[id="transmission"]', 'automatic');
    await authenticatedPage.fill('textarea[placeholder*="Describe"]', 'This car is fucking amazing'); // Неподходящий контент
    await authenticatedPage.check('input[type="checkbox"]:near(:text("phone"))');
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const buffer = Buffer.from('fake image data');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    await expect(authenticatedPage.locator('text=Your listing contains words or phrases that are not allowed')).toBeVisible({ timeout: 10000 });
  });

  test('should show terms and conditions modal before submission', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Заполняем все поля корректно
    await authenticatedPage.fill('input[placeholder*="car brand"]', 'Mercedes');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '35000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '2023');
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.selectOption('select[id="transmission"]', 'automatic');
    await authenticatedPage.fill('textarea[placeholder*="Describe"]', 'Excellent condition, well maintained');
    await authenticatedPage.check('input[type="checkbox"]:near(:text("phone"))');
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const buffer = Buffer.from('fake image data');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    // Проверяем, что модальное окно появилось
    await expect(authenticatedPage.locator('text=Terms and Conditions')).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.locator('text=Your listing will be visible to all users')).toBeVisible();
    await expect(authenticatedPage.locator('text=You are responsible for the accuracy')).toBeVisible();
    
    // Проверяем кнопки
    await expect(authenticatedPage.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Agree & Submit")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Agree & Submit")')).toBeDisabled();
  });

  test('should enable submit only after accepting terms', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Заполняем все поля корректно
    await authenticatedPage.fill('input[placeholder*="car brand"]', 'Audi');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '40000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '2023');
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.selectOption('select[id="transmission"]', 'automatic');
    await authenticatedPage.check('input[type="checkbox"]:near(:text("phone"))');
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const buffer = Buffer.from('fake image data');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    // Проверяем что кнопка отправки отключена
    const agreeButton = authenticatedPage.locator('button:has-text("Agree & Submit")');
    await expect(agreeButton).toBeDisabled();
    
    // Принимаем условия
    await authenticatedPage.check('input[type="checkbox"]:near(:text("I accept the terms"))');
    
    // Проверяем что кнопка активна
    await expect(agreeButton).toBeEnabled();
  });

  test('should allow canceling terms modal', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Заполняем все поля корректно
    await authenticatedPage.fill('input[placeholder*="car brand"]', 'Lexus');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '45000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '2024');
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.selectOption('select[id="transmission"]', 'automatic');
    await authenticatedPage.check('input[type="checkbox"]:near(:text("phone"))');
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const buffer = Buffer.from('fake image data');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    // Ждем появления модального окна
    await expect(authenticatedPage.locator('text=Terms and Conditions')).toBeVisible({ timeout: 10000 });
    
    // Отменяем
    await authenticatedPage.locator('button:has-text("Cancel")').click();
    
    // Проверяем что модальное окно закрылось
    await expect(authenticatedPage.locator('text=Terms and Conditions')).not.toBeVisible();
    
    // Проверяем что мы остались на странице создания объявления
    await expect(authenticatedPage.locator('h2:has-text("Add New Listing")')).toBeVisible();
  });

  test('should show city field when state is selected', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Изначально поле города не должно быть видно
    await expect(authenticatedPage.locator('label:has-text("City")')).not.toBeVisible();
    
    // Выбираем штат
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    
    // Поле города должно появиться
    await expect(authenticatedPage.locator('label:has-text("City")')).toBeVisible({ timeout: 5000 });
    await expect(authenticatedPage.locator('input[placeholder="Start typing city name"]')).toBeVisible();
  });

  test('should validate car engine size format', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Заполняем поля
    await authenticatedPage.fill('input[placeholder*="car brand"]', 'Volkswagen');
    await authenticatedPage.fill('input[placeholder="Enter price"]', '28000');
    await authenticatedPage.fill('input[placeholder="Enter year"]', '2023');
    await authenticatedPage.selectOption('select[id="state"]', { index: 1 });
    await authenticatedPage.selectOption('select[id="transmission"]', 'manual');
    
    // Вводим неверный размер двигателя (слишком большой)
    await authenticatedPage.fill('input[placeholder="2"]', '15'); // 15.0L слишком много
    await authenticatedPage.fill('input[placeholder="0"]', '0');
    
    await authenticatedPage.check('input[type="checkbox"]:near(:text("phone"))');
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const buffer = Buffer.from('fake image data');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    const submitButton = authenticatedPage.locator('button:has-text("Create Listing")');
    await submitButton.click();

    await expect(authenticatedPage.locator('text=Engine size must be between 0.5 and 10.0 liters for cars')).toBeVisible({ timeout: 10000 });
  });

  test('should display blocked user message', async ({ page: authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000');
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'blocked-user-id', email: 'blocked@example.com', is_blocked: true }
      }));
    });
    
    await authenticatedPage.goto('http://localhost:3000/add-listing');
    await authenticatedPage.waitForLoadState('networkidle');

    // Проверяем сообщение о блокировке
    await expect(authenticatedPage.locator('text=Account Blocked')).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.locator('text=You are blocked due to a violation')).toBeVisible();
    
    // Проверяем что форма не видна
    await expect(authenticatedPage.locator('h2:has-text("Add New Listing")')).not.toBeVisible();
  });
});