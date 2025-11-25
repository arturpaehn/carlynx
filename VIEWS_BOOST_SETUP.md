# Views Boost Implementation

## Проблема решена

**1. Сброс views при UPDATE от DealerCenter** ✅ ИСПРАВЛЕНО
- Убрано `views: 0` из `listingData` при обновлении
- Теперь при UPDATE сохраняется текущее значение views
- При INSERT устанавливается начальное значение 0

**2. Автоматическое увеличение views** ✅ ГОТОВО К ПРИМЕНЕНИЮ

## Что делает миграция

Создаёт PostgreSQL функцию и 2 cron job в базе данных:

### Функция `boost_all_listing_views()`
- Добавляет **случайное количество просмотров (7-21)** к каждому активному объявлению
- Работает с обеими таблицами:
  - `listings` (int8) — объявления через интерфейс
  - `external_listings` (int4) — объявления через парсеры и DealerCenter
- Обновляет только активные объявления (`is_active = true`)

### Расписание (Texas Time)
- **6:00 AM Texas** (12:00 UTC) — утренний буст
- **12:00 AM Texas** (06:00 UTC) — ночной буст

Каждое объявление получает свой уникальный прирост просмотров!

## Применение миграции

### В Supabase SQL Editor:

1. Открой **Production**: https://supabase.com/dashboard/project/nusnffvsnhmqxoeqjhjs/sql/new

2. Скопируй содержимое файла:
   ```
   supabase/migrations/20251125000000_add_views_boost_cron.sql
   ```

3. Нажми **Run**

4. Проверь создание jobs:
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE 'boost-views%';
   ```

Должно показать 2 job:
- `boost-views-morning` (12:00 UTC)
- `boost-views-midnight` (06:00 UTC)

## Ручной тест (опционально)

```sql
-- Проверь текущие views для нескольких объявлений
SELECT id, title, views, is_active 
FROM listings 
WHERE is_active = true 
LIMIT 5;

SELECT id, title, views, is_active 
FROM external_listings 
WHERE is_active = true 
LIMIT 5;

-- Запусти функцию вручную
SELECT boost_all_listing_views();

-- Проверь обновлённые views (должны вырасти на 7-21)
SELECT id, title, views, is_active 
FROM listings 
WHERE is_active = true 
LIMIT 5;

SELECT id, title, views, is_active 
FROM external_listings 
WHERE is_active = true 
LIMIT 5;
```

## Безопасность

✅ Функция обновляет только активные объявления
✅ Views никогда не сбрасываются при обновлении контента
✅ Каждое объявление получает разный рандомный прирост
✅ Работает автоматически без участия кода приложения

## Отключение (если нужно)

```sql
-- Удалить cron jobs
SELECT cron.unschedule('boost-views-morning');
SELECT cron.unschedule('boost-views-midnight');

-- Удалить функцию
DROP FUNCTION IF EXISTS boost_all_listing_views();
```
