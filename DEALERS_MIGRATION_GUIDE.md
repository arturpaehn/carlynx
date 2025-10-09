# 🏢 Dealers Functionality - Database Setup

## 📋 Что добавляет эта миграция:

### 1. **Типы пользователей**
- `individual` - обычный пользователь ($5 за объявление)
- `dealer` - дилер (подписка $400-3000/месяц в зависимости от количества объявлений)

### 2. **Таблицы**
- `dealers` - информация о дилерах и подписках
- `dealer_subscriptions` - история платежей
- `subscription_tiers` - тарифные планы

### 3. **Тарифные планы**

| Tier | Price | Listings/month | Features |
|------|-------|----------------|----------|
| **Up to 100** | $400/mo | 100 | Verified badge |
| **Up to 250** | $800/mo | 250 | + Priority support, Analytics |
| **Up to 500** | $1,250/mo | 500 | + 10 featured listings |
| **Up to 1000** | $2,000/mo | 1000 | + 20 featured listings |
| **Unlimited** | $3,000/mo | Unlimited | + API access, Unlimited featured |

### 4. **Функции**
- `check_individual_listing_limit()` - проверка лимитов
- `reset_dealer_monthly_counters()` - сброс счётчиков (1-го числа каждого месяца)
- `update_expired_dealer_subscriptions()` - деактивация просроченных подписок
- `can_user_create_listing(user_id)` - проверка возможности создания листинга

---

## 🚀 Как применить миграцию:

### Способ 1: Через Supabase Dashboard (рекомендуется)

1. Открыть https://supabase.com/dashboard/project/kjntriyhqpfxqciaxbpj/editor
2. SQL Editor → New Query
3. Скопировать весь код из `20250103_add_dealers_functionality.sql`
4. Вставить и нажать **"Run"**
5. Проверить что выполнилось без ошибок

### Способ 2: Через Supabase CLI

```powershell
# Если установлен Supabase CLI
supabase db push

# Или напрямую применить миграцию
psql <connection-string> < supabase/migrations/20250103_add_dealers_functionality.sql
```

---

## ✅ Проверка после миграции:

### 1. Проверить таблицы

```sql
-- Должны появиться новые таблицы
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dealers', 'dealer_subscriptions', 'subscription_tiers');
```

### 2. Проверить колонку user_type

```sql
-- Должна появиться колонка user_type в profiles
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'user_type';
```

### 3. Проверить тарифы

```sql
-- Должно быть 3 тарифа
SELECT tier_id, tier_name, monthly_price, listing_limit 
FROM subscription_tiers;
```

Expected output:
```
tier_id    | tier_name         | monthly_price | listing_limit
-----------|-------------------|---------------|---------------
basic      | Basic Dealer      | 50.00         | 50
premium    | Premium Dealer    | 100.00        | NULL (unlimited)
enterprise | Enterprise Dealer | 200.00        | NULL (unlimited)
```

### 4. Тест функции проверки

```sql
-- Проверить что функция работает (замени на реальный user_id)
SELECT can_user_create_listing('ваш-user-uuid-здесь');
```

---

## 🔧 Настройка Cron Jobs (опционально)

Для автоматического сброса счётчиков и проверки подписок нужно настроить cron:

### В Supabase (через pg_cron extension):

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Reset dealer counters on 1st of each month at midnight
SELECT cron.schedule(
  'reset-dealer-counters',
  '0 0 1 * *',
  'SELECT reset_dealer_monthly_counters()'
);

-- Check expired subscriptions daily at 2 AM
SELECT cron.schedule(
  'check-expired-subscriptions',
  '0 2 * * *',
  'SELECT update_expired_dealer_subscriptions()'
);
```

### Или через внешний сервис (Vercel Cron, GitHub Actions):

Создать API endpoints:
- `/api/cron/reset-dealer-counters` → вызывает `reset_dealer_monthly_counters()`
- `/api/cron/check-subscriptions` → вызывает `update_expired_dealer_subscriptions()`

---

## 📝 Следующие шаги:

После применения миграции нужно создать:

1. **Frontend для дилеров:**
   - [ ] Страница выбора типа аккаунта при регистрации
   - [ ] Форма регистрации дилера (название компании и т.д.)
   - [ ] Dashboard для дилеров
   - [ ] Страница управления подпиской

2. **Stripe Integration:**
   - [ ] Создание подписки через Stripe
   - [ ] Webhook для обновления статуса подписки
   - [ ] Страница выбора тарифного плана

3. **UI Updates:**
   - [ ] Бейдж "Verified Dealer" на листингах
   - [ ] Страница компании дилера
   - [ ] Фильтр "Только дилеры" в поиске

---

## 🔒 Безопасность:

✅ RLS policies настроены:
- Дилеры видят только свои данные
- Публичный доступ только к верифицированным дилерам
- Подписки видны только владельцу

✅ Триггеры проверяют:
- Статус подписки перед созданием листинга
- Месячные лимиты для Basic tier
- Автоматическое обновление счётчиков

---

## 🐛 Troubleshooting:

**Ошибка: "relation already exists"**
→ Таблица уже существует, пропустить создание (миграция безопасна для повторного запуска)

**Ошибка: "function does not exist"**
→ Убедиться что все функции созданы, проверить логи

**Cron jobs не работают**
→ Проверить что pg_cron extension установлен
→ Или настроить внешний cron через API

---

**Готово к применению!** 🚀

Применить миграцию сейчас или сначала протестировать на dev окружении?
