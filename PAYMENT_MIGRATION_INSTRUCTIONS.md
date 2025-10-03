# Payment System Migration Instructions

## Шаги для активации платёжной системы:

### 1. Выполнить SQL миграцию в Supabase

1. Откройте ваш проект в Supabase Dashboard: https://supabase.com/dashboard
2. Перейдите в **SQL Editor** (левое меню)
3. Откройте файл `supabase/migrations/20250102_add_payment_system.sql`
4. Скопируйте весь SQL код из файла
5. Вставьте в SQL Editor
6. Нажмите **RUN** (или Ctrl+Enter)

### 2. Проверка успешной миграции

После выполнения миграции проверьте что создано:

```sql
-- Проверка колонок в listings
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name IN ('payment_status', 'payment_id', 'created_by_type');

-- Проверка таблицы individual_payments
SELECT * FROM individual_payments LIMIT 1;

-- Проверка индексов
SELECT indexname FROM pg_indexes 
WHERE tablename = 'individual_payments' OR tablename = 'listings'
ORDER BY indexname;
```

### 3. Что было добавлено:

#### В таблицу `listings`:
- `payment_status` - статус оплаты ('unpaid', 'free_trial', 'pending', 'paid', 'refunded')
- `payment_id` - UUID ссылка на individual_payments.payment_id
- `created_by_type` - тип создателя ('individual' или 'dealer')

#### Новая таблица `individual_payments`:
- `payment_id` - UUID первичный ключ
- `user_id` - ссылка на пользователя
- `listing_id` - ссылка на объявление (INT)
- `amount` - сумма платежа (DECIMAL)
- `stripe_payment_intent_id` - ID Stripe Payment Intent (NULL для free trial)
- `payment_status` - статус ('free_trial', 'pending', 'succeeded', etc.)
- `payment_method` - метод ('free_trial', 'card', 'bank_transfer', 'paypal')
- `metadata` - JSONB для дополнительной информации

#### Индексы для производительности:
- `idx_listings_payment_status` - быстрый поиск по статусу
- `idx_individual_payments_user_id` - поиск платежей пользователя
- `idx_individual_payments_stripe_payment_intent` - поиск по Stripe ID

#### RLS Policies:
- Пользователи могут видеть только свои платежи
- Пользователи могут создавать свои платежи

### 4. Текущий режим: FREE TRIAL

В файле `src/components/individual/PaymentConfirmModal.tsx` установлен флаг:
```typescript
const IS_FREE_TRIAL = true;
```

Это означает:
- ✅ Все объявления создаются бесплатно
- ✅ В БД сохраняется payment запись с `payment_status='free_trial'`
- ✅ Listing получает `payment_status='free_trial'`
- ✅ Пользователь видит кнопку "✓ Add My Listing FREE"
- ✅ Stripe поля остаются NULL

### 5. Активация Stripe (когда будете готовы):

1. Зарегистрируйтесь в Stripe: https://stripe.com
2. Получите API ключи (Test/Live)
3. Установите Stripe SDK: `npm install @stripe/stripe-js stripe`
4. Измените `IS_FREE_TRIAL = false` в PaymentConfirmModal.tsx
5. Добавьте Stripe логику в функцию `handleConfirm`

### 6. Тестирование миграции:

После миграции попробуйте создать новое объявление:
1. Войдите как обычный пользователь
2. Перейдите в "Add Listing"
3. Заполните форму
4. Нажмите Submit
5. Должна появиться модалка **"Confirm Your Free Listing"** с зелёной кнопкой
6. После подтверждения - проверьте в БД что создались записи в `listings` и `individual_payments`

```sql
-- Проверка созданных записей
SELECT 
  l.id,
  l.title,
  l.payment_status,
  l.payment_id,
  l.created_by_type,
  p.payment_status as payment_record_status,
  p.payment_method,
  p.amount
FROM listings l
LEFT JOIN individual_payments p ON l.payment_id = p.payment_id
WHERE l.user_id = 'YOUR_USER_ID'
ORDER BY l.created_at DESC
LIMIT 5;
```

### 7. Будущие возможности:

После активации Stripe вы сможете:
- Принимать платежи $10 за объявление
- Отслеживать успешные/неудачные транзакции
- Выдавать refunds через Stripe Dashboard
- Видеть payment history пользователей
- Автоматически деактивировать неоплаченные объявления

### 8. Troubleshooting:

**Ошибка: "column already exists"**
- Миграция уже была выполнена, используйте `ALTER TABLE IF NOT EXISTS` или пропустите

**Ошибка: "payment record creation failed"**
- Проверьте RLS policies: `SELECT * FROM individual_payments` от имени authenticated пользователя
- Проверьте GRANT permissions в миграции

**Listing создаётся без payment_id**
- Проверьте что payment запись создаётся первой и возвращает payment_id
- Проверьте `.single()` в Supabase query

## Готово! 🎉

Платёжная система готова к использованию. Пока работает в режиме FREE TRIAL, но вся инфраструктура для Stripe уже на месте.
