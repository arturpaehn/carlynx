# 🧪 Руководство по тестированию дилерской подписки

## ✅ Исправленные проблемы

### Проблема #1: Триал не блокировал после истечения
**Исправлено:** Код проверял `'trialing'` вместо `'trial'` - теперь после истечения 7 дней дилер НЕ сможет добавлять объявления без покупки пакета.

**Файлы исправлены:**
- `src/app/dealer/add-listing/page.tsx`
- `src/app/dealer/my-listings/page.tsx`
- `src/app/dealer/dashboard/page.tsx`

---

## 🧪 Как безопасно протестировать оплату БЕЗ реальных денег

### Метод 1: Stripe Test Mode (уже активен!)

В `.env.local` используются **тестовые ключи**:
```bash
STRIPE_SECRET_KEY=sk_test_...  # Тестовый ключ из .env.local
```

**Все платежи в тестовом режиме - не списываются реальные деньги!**

#### Тестовые карты Stripe:

```
✅ Успешная оплата:
Номер карты:  4242 4242 4242 4242
CVV:          любые 3 цифры (например 123)
Срок:         любая будущая дата (например 12/34)
ZIP:          любой (например 12345)

❌ Отклонённая карта:
Номер карты:  4000 0000 0000 0002

⚠️ Требуется дополнительная аутентификация:
Номер карты:  4000 0025 0000 3155
```

**Полный список тестовых карт:** https://docs.stripe.com/testing#cards

---

### Метод 2: Временно изменить цены пакетов на $0.50

**Внимание:** Не делай это в продакшене! Только для локального тестирования.

1. Открой Supabase Dashboard
2. Найди таблицу `subscription_tiers`
3. Временно измени `monthly_price` на `0.50` (50 центов)
4. После тестирования верни настоящие цены:
   - tier_100: $400
   - tier_250: $800
   - tier_500: $1250
   - tier_1000: $2000
   - tier_unlimited: $3000

---

### Метод 3: Webhook локального тестирования (рекомендую!)

Stripe может отправлять вебхуки на твой локальный сервер:

#### Установи Stripe CLI:

**Windows (PowerShell):**
```powershell
# Скачай с https://github.com/stripe/stripe-cli/releases
# Или через Scoop:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

#### Настрой webhook forwarding:

```powershell
# Войди в Stripe
stripe login

# Запусти туннель (в отдельном терминале)
stripe listen --forward-to localhost:3000/api/dealer/webhooks/stripe

# Скопируй webhook secret и добавь в .env.local:
# STRIPE_WEBHOOK_SECRET_DEALER=whsec_...
```

#### Тестируй события:

```powershell
# Симулируй успешную оплату
stripe trigger payment_intent.succeeded

# Симулируй истечение триала
stripe trigger customer.subscription.trial_will_end

# Симулируй отмену подписки
stripe trigger customer.subscription.deleted
```

---

### Метод 4: Создать специальный промокод (100% скидка)

Создай купон в Stripe Dashboard для тестирования:

1. Открой [Stripe Dashboard → Products → Coupons](https://dashboard.stripe.com/test/coupons)
2. Create coupon → 100% off → Duration: Once
3. Добавь в Checkout Session:

**Файл:** `src/app/api/dealer/create-subscription/route.ts`

```typescript
const session = await stripe.checkout.sessions.create({
  // ... существующий код ...
  allow_promotion_codes: true, // Добавь эту строку!
  // или:
  discounts: [{
    coupon: 'TEST_100_OFF' // ID купона из Stripe
  }]
})
```

---

### Метод 5: Ручное управление статусом в БД (для быстрого тестирования)

**Запросы для Supabase SQL Editor:**

```sql
-- 1️⃣ Сделать дилера с активным триалом
UPDATE dealers 
SET 
  subscription_status = 'trial',
  trial_end_date = NOW() + INTERVAL '7 days',
  current_tier_id = 'tier_100'
WHERE user_id = 'YOUR_USER_ID';

-- 2️⃣ Истечь триал (для тестирования блокировки)
UPDATE dealers 
SET 
  subscription_status = 'trial',
  trial_end_date = NOW() - INTERVAL '1 day'  -- Вчера истёк
WHERE user_id = 'YOUR_USER_ID';

-- 3️⃣ Активировать платную подписку
UPDATE dealers 
SET 
  subscription_status = 'active',
  current_tier_id = 'tier_100',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '30 days'
WHERE user_id = 'YOUR_USER_ID';

-- 4️⃣ Отменить подписку
UPDATE dealers 
SET 
  subscription_status = 'canceled',
  subscription_end_date = NOW()
WHERE user_id = 'YOUR_USER_ID';

-- 5️⃣ Узнать свой USER_ID
SELECT user_id, subscription_status, trial_end_date, current_tier_id
FROM dealers
WHERE user_id IN (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'твой@email.com'
);
```

---

## 🎯 Сценарии тестирования

### Сценарий 1: Полный жизненный цикл триала

1. ✅ Зарегистрируйся как дилер
2. ✅ Начни 7-дневный триал
3. ✅ Добавь 5+ объявлений (должно работать - триал даёт неограниченно)
4. ⚠️ Измени дату триала на истекшую:
   ```sql
   UPDATE dealers 
   SET trial_end_date = NOW() - INTERVAL '1 day'
   WHERE user_id = 'твой_user_id';
   ```
5. 🚫 Попробуй добавить объявление - должна быть блокировка!
6. ✅ Купи пакет (тестовой картой 4242...)
7. ✅ Проверь, что можешь снова добавлять объявления

---

### Сценарий 2: Тест лимитов пакета

1. Активируй Tier 100 (100 объявлений)
2. Создай 99 объявлений
3. Добавь ещё 1 - должно работать
4. Попробуй добавить 101-е - должна быть блокировка
5. Деактивируй 5 объявлений
6. Теперь можешь добавить ещё 5

---

### Сценарий 3: Тест отмены подписки

1. Купи пакет
2. Отмени подписку на странице `/dealer/subscription`
3. Проверь, что `cancel_at_period_end = true`
4. Убедись, что можешь добавлять объявления до конца периода
5. После истечения подписки - должна быть блокировка

---

## 🔍 Проверка логов

### Stripe Dashboard:
1. https://dashboard.stripe.com/test/dashboard
2. **Events** → смотри все вебхуки
3. **Customers** → твой тестовый аккаунт
4. **Subscriptions** → статус подписки

### Vercel/Railway Logs:
```
[Dealer Webhook] Event type: customer.subscription.created
[Subscription Created] User: abc123, Subscription: sub_xxx
[Subscription Created] Updated dealer abc123 to trial
```

### Supabase Logs:
Database → Logs → SQL statements

---

## 🛑 Важно перед продакшеном!

1. **Замени тестовые ключи на продакшен:**
   ```bash
   # .env.production
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Настрой продакшен webhook:**
   - Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://carlynx.us/api/dealer/webhooks/stripe`
   - Events: `customer.subscription.*`, `invoice.payment_*`

3. **Проверь цены в БД:**
   ```sql
   SELECT * FROM subscription_tiers WHERE active = true;
   ```

4. **Включи Stripe Radar** (защита от мошенничества)

---

## 📊 Таблица статусов подписки

| Status | Описание | Может добавлять объявления? |
|--------|----------|----------------------------|
| `trial` | 7-дневный триал | ✅ Да, неограниченно |
| `active` | Активная оплата | ✅ Да, по лимиту пакета |
| `past_due` | Просрочен платёж | ⚠️ Stripe продолжает попытки |
| `canceled` | Подписка отменена | 🚫 Нет |
| `inactive` | Нет подписки | 🚫 Нет |

---

## 🆘 Если что-то не работает

### Проблема: Webhook не приходит
**Решение:**
1. Проверь `STRIPE_WEBHOOK_SECRET_DEALER` в `.env`
2. Используй `stripe listen --forward-to` для локального тестирования
3. Проверь логи Stripe Dashboard → Events → Webhook attempts

### Проблема: Триал не истекает
**Решение:**
1. Проверь, что Stripe отправляет `customer.subscription.updated` событие
2. Webhook должен обновить `subscription_status` с `trial` на `active` или `canceled`

### Проблема: Не перенаправляет на Stripe Checkout
**Решение:**
1. Проверь логи: `console.log('🔗 URL received:', data.url)`
2. Убедись, что `NEXT_PUBLIC_BASE_URL` правильный

---

## ✅ Чеклист перед запуском в продакшен

- [ ] Замени Stripe test keys на live keys
- [ ] Настрой продакшен webhook endpoint
- [ ] Проверь цены всех пакетов в БД
- [ ] Протестируй полный цикл: регистрация → триал → оплата → отмена
- [ ] Включи Stripe email уведомления для клиентов
- [ ] Настрой 3D Secure для европейских карт
- [ ] Добавь страницу Terms & Conditions
- [ ] Протестируй на реальной карте с $0.50

---

Готово! Теперь ты можешь безопасно тестировать весь функционал без риска потратить реальные деньги. 🎉
