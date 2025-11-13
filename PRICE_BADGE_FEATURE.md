# Price Badge Feature - Implementation Guide

## 📋 Обзор

Добавлена функциональность отображения бейджей оценки цены **"Good / Fair / High"** на основе сравнения с рыночными средними ценами в Техасе.

**Логика бейджей:**
- 🟢 **Good Price** (Хорошая цена) - цена < 80% от средней рыночной
- 🔵 **Fair Price** (Нормальная цена) - цена 80-120% от средней рыночной  
- 🟠 **High Price** (Высокая цена) - цена > 120% от средней рыночной

---

## 🗄️ База данных

### 1. Таблица `vehicle_price_benchmarks`

**Файл миграции:** `supabase/migrations/20250112000000_create_vehicle_price_benchmarks.sql`

**Структура:**
```sql
CREATE TABLE vehicle_price_benchmarks (
  id UUID PRIMARY KEY,
  brand TEXT NOT NULL,           -- Марка (Toyota, Ford, etc.)
  model TEXT NOT NULL,           -- Модель (Camry, F-150, etc.)
  year INTEGER NOT NULL,         -- Год (1980-2030)
  avg_price NUMERIC(10,2),      -- Средняя цена в USD
  min_price NUMERIC(10,2),      -- Минимальная цена
  max_price NUMERIC(10,2),      -- Максимальная цена
  sample_count INTEGER,          -- Количество объявлений для статистики
  state_code TEXT DEFAULT 'TX',
  last_updated TIMESTAMP,
  created_at TIMESTAMP,
  UNIQUE(brand, model, year)
);
```

**RLS Политики:**
- ✅ **Публичное чтение** - все пользователи (авторизованные и анонимные) могут читать данные
- 🔒 **Только service_role** может изменять данные (администраторы через SQL)

### 2. Функция `get_price_badge()`

**Синтаксис:**
```sql
SELECT get_price_badge(
  'Toyota',    -- brand
  'Camry',     -- model
  2020,        -- year
  25000        -- price
);
-- Вернет: 'good' | 'fair' | 'high' | NULL
```

**Примеры:**
```sql
-- Good Price (низкая цена)
SELECT get_price_badge('Ford', 'F-150', 2020, 30000);  -- Вернет 'good'

-- Fair Price (нормальная)
SELECT get_price_badge('Ford', 'F-150', 2020, 45000);  -- Вернет 'fair'

-- High Price (высокая)
SELECT get_price_badge('Ford', 'F-150', 2020, 60000);  -- Вернет 'high'
```

---

## 📝 Наполнение данными

### Шаг 1: Запустить миграцию

В Supabase SQL Editor выполните:
```sql
-- Содержимое из supabase/migrations/20250112000000_create_vehicle_price_benchmarks.sql
```

### Шаг 2: Наполнить таблицу ценами

**Вариант A: Использовать заготовку с AI**

1. Откройте файл `generate_price_data_template.sql`
2. Скопируйте все INSERT statements
3. Попросите ChatGPT/Claude заполнить реалистичные цены:

```
Промпт для AI:
"Заполни реалистичные средние цены (avg_price) для этих автомобилей 
на рынке Техаса на основе года. Используй актуальные рыночные данные 
2024-2025 года из KBB, NADA, Edmunds. Для старых годов (1980-1990) 
используй сниженные цены с учетом износа. Сохрани формат INSERT."
```

4. Выполните заполненный SQL в Supabase

**Вариант B: Ручная вставка популярных моделей**

```sql
-- Пример для популярных моделей
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Ford', 'F-150', 2020, 45000, 38000, 55000, 150),
('Toyota', 'Camry', 2020, 25000, 21000, 32000, 120),
('Honda', 'Civic', 2020, 22000, 18000, 29000, 100),
('Chevrolet', 'Silverado', 2020, 45000, 38000, 56000, 140);
```

### Шаг 3: Проверить данные

```sql
-- Количество записей
SELECT COUNT(*) FROM vehicle_price_benchmarks;

-- Распределение по маркам
SELECT brand, COUNT(*) as models_count 
FROM vehicle_price_benchmarks 
GROUP BY brand 
ORDER BY models_count DESC;

-- Проверка для конкретной модели
SELECT * FROM vehicle_price_benchmarks 
WHERE brand = 'Ford' AND model = 'F-150' 
ORDER BY year DESC;
```

---

## 🎨 Frontend компоненты

### Компонент PriceBadge

**Файл:** `src/components/PriceBadge.tsx`

**Использование:**
```tsx
import PriceBadge from '@/components/PriceBadge';

<PriceBadge 
  brand="Toyota"
  model="Camry"
  year={2020}
  price={25000}
  className="text-xs"
/>
```

**Свойства:**
- `brand` - марка автомобиля
- `model` - модель
- `year` - год выпуска
- `price` - цена объявления
- `className` - дополнительные CSS классы (опционально)

**Визуальное отображение:**
- 🟢 **Good Price** - зеленый фон, текст "Good Price"
- 🔵 **Fair Price** - синий фон, текст "Fair Price"
- 🟠 **High Price** - оранжевый фон, текст "High Price"

---

## 🌐 Локализация

Переводы добавлены в `public/locales/*/common.json`:

**Английский (`en/common.json`):**
```json
"priceBadge": {
  "good": "Good Price",
  "fair": "Fair Price",
  "high": "High Price",
  "goodDescription": "This price is below market average - a great deal!",
  "fairDescription": "This price is within the normal market range",
  "highDescription": "This price is above market average"
}
```

**Испанский (`es/common.json`):**
```json
"priceBadge": {
  "good": "Buen Precio",
  "fair": "Precio Justo",
  "high": "Precio Alto",
  "goodDescription": "Este precio está por debajo del promedio del mercado - ¡una gran oferta!",
  "fairDescription": "Este precio está dentro del rango normal del mercado",
  "highDescription": "Este precio está por encima del promedio del mercado"
}
```

---

## 📍 Где отображается PriceBadge

### 1. Главная страница (`src/app/page.tsx`)
- Карточки объявлений в сетке
- Отображается под названием, перед годом выпуска

### 2. Детальная страница (`src/app/listing/[id]/page.tsx`)
- Под ценой объявления
- Рядом с кнопкой "Calculate Auto Loan"

### 3. API эндпоинт обновлен
**Файл:** `src/app/api/homepage-listings/route.ts`
- Добавлено поле `brand` в ответ API
- Для `listings` - извлекается из `title` (первое слово)
- Для `external_listings` - используется поле `brand` из БД

---

## 🧪 Тестирование

### 1. Проверка функции в БД

```sql
-- Должно вернуть 'good'
SELECT get_price_badge('Ford', 'F-150', 2020, 30000);

-- Должно вернуть 'fair'
SELECT get_price_badge('Ford', 'F-150', 2020, 45000);

-- Должно вернуть 'high'
SELECT get_price_badge('Ford', 'F-150', 2020, 60000);

-- Должно вернуть NULL (нет данных)
SELECT get_price_badge('UnknownBrand', 'UnknownModel', 2020, 10000);
```

### 2. Проверка в UI

1. **На главной странице:**
   - Откройте главную страницу
   - Проверьте, что бейджи отображаются на карточках с полными данными (brand, model, year, price)
   - Бейджи НЕ должны показываться, если нет benchmark данных

2. **На детальной странице:**
   - Откройте любое объявление
   - Бейдж должен быть под ценой
   - При наведении показывается tooltip с описанием

3. **Локализация:**
   - Переключите язык на испанский
   - Проверьте переводы бейджей

---

## 🔧 Обслуживание и обновление

### Добавление новых моделей

```sql
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count)
VALUES ('BMW', 'X5', 2023, 72000, 65000, 85000, 50);
```

### Обновление цен

```sql
UPDATE vehicle_price_benchmarks
SET 
  avg_price = 48000,
  min_price = 42000,
  max_price = 58000,
  last_updated = NOW()
WHERE brand = 'Ford' AND model = 'F-150' AND year = 2020;
```

### Массовое обновление на основе реальных объявлений

```sql
-- Пример: обновить средние цены на основе активных объявлений
UPDATE vehicle_price_benchmarks b
SET 
  avg_price = (
    SELECT AVG(l.price)
    FROM listings l
    WHERE LOWER(l.title) LIKE LOWER(b.brand || '%')
      AND l.year = b.year
      AND l.is_active = true
  ),
  sample_count = (
    SELECT COUNT(*)
    FROM listings l
    WHERE LOWER(l.title) LIKE LOWER(b.brand || '%')
      AND l.year = b.year
      AND l.is_active = true
  ),
  last_updated = NOW()
WHERE EXISTS (
  SELECT 1 FROM listings l
  WHERE LOWER(l.title) LIKE LOWER(b.brand || '%')
    AND l.year = b.year
    AND l.is_active = true
);
```

---

## 📊 Мониторинг

### Статистика покрытия

```sql
-- Сколько уникальных моделей в базе
SELECT COUNT(*) as total_models FROM vehicle_price_benchmarks;

-- Покрытие по годам
SELECT year, COUNT(*) as models_count 
FROM vehicle_price_benchmarks 
GROUP BY year 
ORDER BY year DESC;

-- Топ марок по количеству моделей
SELECT brand, COUNT(*) as model_count
FROM vehicle_price_benchmarks
GROUP BY brand
ORDER BY model_count DESC
LIMIT 10;
```

### Проверка актуальности данных

```sql
-- Устаревшие данные (не обновлялись > 6 месяцев)
SELECT brand, model, year, last_updated
FROM vehicle_price_benchmarks
WHERE last_updated < NOW() - INTERVAL '6 months'
ORDER BY last_updated;
```

---

## 🐛 Возможные проблемы

### Бейджи не отображаются

**Причины:**
1. Нет данных в `vehicle_price_benchmarks` для данной марки/модели/года
2. Brand/model/year не совпадают (проверьте регистр, пробелы)
3. RLS политики не настроены

**Решение:**
```sql
-- Проверить наличие данных
SELECT * FROM vehicle_price_benchmarks 
WHERE LOWER(brand) = LOWER('Toyota') 
  AND LOWER(model) = LOWER('Camry') 
  AND year = 2020;

-- Проверить RLS политики
SELECT * FROM pg_policies WHERE tablename = 'vehicle_price_benchmarks';
```

### Неверная оценка цены

**Причины:**
1. Устаревшие данные в таблице
2. Неправильные средние цены

**Решение:**
- Обновите данные на основе актуальных рыночных цен
- Проверьте логику функции `get_price_badge()`

---

## 🚀 Deployment

1. **Запустите миграцию** в production БД
2. **Наполните таблицу** данными (используя AI или вручную)
3. **Проверьте RLS политики** - убедитесь что публичное чтение работает
4. **Deploy frontend** - изменения автоматически подхватятся

---

## 📚 Дополнительно

### Источники данных для цен:

- **Kelley Blue Book (KBB)** - https://www.kbb.com/
- **NADA Guides** - https://www.nadaguides.com/
- **Edmunds** - https://www.edmunds.com/
- **Cars.com** - https://www.cars.com/
- **AutoTrader** - https://www.autotrader.com/

### Формула расчета:

```
price_ratio = (listing_price / average_price) * 100

if price_ratio < 80:
  badge = 'good'
elif 80 <= price_ratio <= 120:
  badge = 'fair'
else:
  badge = 'high'
```

---

## ✅ Чеклист внедрения

- [x] Создана миграция для таблицы `vehicle_price_benchmarks`
- [x] Добавлена функция `get_price_badge()`
- [x] Настроены RLS политики для публичного доступа
- [x] Создан компонент `PriceBadge`
- [x] Добавлены переводы (EN, ES)
- [x] Интегрировано на главной странице
- [x] Интегрировано на детальной странице
- [x] Обновлен API для передачи `brand`
- [ ] **TODO: Наполнить таблицу реальными данными по ценам**
- [ ] **TODO: Проверить в production**

---

**Дата создания:** 12 ноября 2025  
**Версия:** 1.0  
**Автор:** GitHub Copilot + Artur
