# 💳 Stripe Live Integration - Setup Instructions

## ⚠️ ВАЖНО: Вы используете LIVE ключи - реальные деньги будут списываться!

## Шаг 1: Установка Stripe SDK (2 минуты)

```bash
cd C:\Users\artur\Documents\carlynx-0.6.0
npm install stripe @stripe/stripe-js
```

## Шаг 2: Получить Live API Keys из Stripe (5 минут)

1. Перейти на https://dashboard.stripe.com/apikeys
2. Переключить на **Live mode** (переключатель в правом верхнем углу)
3. Скопировать ключи:

```
Publishable key (начинается с pk_live_):
pk_live_YOUR_PUBLISHABLE_KEY_HERE

Secret key (начинается с sk_live_) - кликнуть "Reveal live key":
sk_live_YOUR_SECRET_KEY_HERE
```

## Шаг 3: Создать .env.local (1 минута)

Создайте файл `.env.local` в корне проекта:

```bash
# В папке C:\Users\artur\Documents\carlynx-0.6.0\
# Создать файл .env.local
```

Скопировать содержимое из `.env.local.example` и заменить на свои ключи:

```env
# Stripe LIVE Keys - PRODUCTION
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_ВАШ_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_ВАШ_SECRET_KEY

# Webhook secret (получите на шаге 5)
STRIPE_WEBHOOK_SECRET=whsec_ВАШ_WEBHOOK_SECRET

# Supabase Service Role Key (для webhooks)
SUPABASE_SERVICE_ROLE_KEY=ВАШ_SERVICE_ROLE_KEY

# Production domain
NEXT_PUBLIC_APP_URL=https://carlynx.us
```

**Где взять SUPABASE_SERVICE_ROLE_KEY:**
1. Supabase Dashboard → Settings → API
2. Скопировать **service_role** key (⚠️ секретный, не публиковать!)

## Шаг 4: Активировать Stripe в коде (1 минута)

Изменить флаг в `src/components/individual/PaymentConfirmModal.tsx`:

```typescript
// Строка 7:
const IS_FREE_TRIAL = false;  // ← Изменить с true на false
```

## Шаг 5: Настроить Webhook (10 минут)

### 5.1. Задеплоить приложение на продакшен

Сначала нужен публичный URL (например, https://carlynx.us)

```bash
# Пример с Vercel:
npm install -g vercel
vercel --prod

# Или другой хостинг
```

### 5.2. Создать Webhook Endpoint в Stripe

1. Открыть https://dashboard.stripe.com/webhooks
2. Переключить на **Live mode**
3. Кликнуть **"Add endpoint"**

**Настройки endpoint:**
```
Endpoint URL: https://carlynx.us/api/webhooks/stripe

Description: CarLynx payment webhooks

Events to send (выбрать):
☑ checkout.session.completed
☑ payment_intent.succeeded
☑ payment_intent.payment_failed
☑ charge.refunded
```

4. Кликнуть **"Add endpoint"**
5. Скопировать **"Signing secret"** (начинается с `whsec_`)
6. Добавить в `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_ВАШ_WEBHOOK_SECRET
```

### 5.3. Тестирование webhook локально (optional)

Для тестирования локально используйте Stripe CLI:

```bash
# Установить Stripe CLI
# Windows: https://github.com/stripe/stripe-cli/releases

# Логин
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Скопировать whsec_ ключ и добавить в .env.local
```

## Шаг 6: Проверить .gitignore (КРИТИЧНО!)

Убедитесь что `.env.local` в `.gitignore`:

```gitignore
# .gitignore
.env.local
.env*.local
.env
```

**⚠️ НИКОГДА не коммитить live ключи в Git!**

## Шаг 7: Перезапуск сервера (1 минута)

```bash
# Остановить текущий сервер (Ctrl+C)
# Перезапустить с новыми env переменными:
npm run dev
```

## Шаг 8: Тестирование Full Flow (10 минут)

### 8.1. Создать тестовое объявление:

1. http://localhost:3000
2. Login
3. Add Listing
4. Заполнить все поля
5. Submit

### 8.2. Должна появиться Payment Modal:

✅ **НЕ будет** зелёного баннера "FREE"  
✅ Кнопка: **"Proceed to Payment"** (синяя)  
✅ Цена: **$10.00**

### 8.3. Клик на "Proceed to Payment":

- Перенаправит на Stripe Checkout (https://checkout.stripe.com/...)
- Secure SSL страница Stripe

### 8.4. Ввести тестовую карту:

**⚠️ Используйте ТЕСТОВУЮ карту (даже на Live mode):**
```
Card number: 4242 4242 4242 4242
Expiry: 12/34 (любая будущая дата)
CVC: 123
ZIP: 12345
```

> **Примечание:** Stripe в Test Mode позволяет использовать тестовые карты.  
> В Live Mode с РЕАЛЬНОЙ картой будут РЕАЛЬНЫЕ списания!

### 8.5. После успешной оплаты:

✅ Redirect на `/payment-success?session_id=cs_xxx`  
✅ Зелёная галочка "Payment Successful!"  
✅ Автоматический redirect на `/my-listings` через 3 секунды

### 8.6. Проверить в БД:

```sql
-- Проверить payment запись
SELECT * FROM individual_payments 
WHERE payment_status = 'succeeded'
ORDER BY created_at DESC LIMIT 1;

-- Должно быть:
-- payment_status = 'succeeded'
-- stripe_payment_intent_id = 'pi_xxxxx'
-- stripe_session_id = 'cs_xxxxx'
-- paid_at = текущее время

-- Проверить listing
SELECT * FROM listings
WHERE payment_status = 'paid'
ORDER BY created_at DESC LIMIT 1;
```

## Шаг 9: Проверить Stripe Dashboard

1. https://dashboard.stripe.com/payments
2. Должен появиться новый платёж $10.00
3. Status: Succeeded
4. Customer email
5. Description: "CarLynx Vehicle Listing"

## Шаг 10: Мониторинг Webhooks

https://dashboard.stripe.com/webhooks

- Проверить что webhook endpoint активен
- Status: Enabled
- События приходят успешно (зелёная галочка)

---

## 🔒 Security Checklist

- [x] `.env.local` добавлен в `.gitignore`
- [x] Live keys НЕ закоммичены в Git
- [x] SUPABASE_SERVICE_ROLE_KEY используется только в webhook API
- [x] Webhook signature verification включена
- [x] HTTPS используется на продакшене
- [x] RLS политики активны

---

## ⚙️ Production Deployment

### Vercel (рекомендуется):

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Add environment variables in Vercel Dashboard:
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_APP_URL
```

### После деплоя:

1. Обновить webhook URL в Stripe на production URL
2. Протестировать полный flow на продакшене
3. Мониторить логи: `vercel logs`

---

## 📊 Monitoring

### Stripe Dashboard:
- https://dashboard.stripe.com/payments - все платежи
- https://dashboard.stripe.com/webhooks - webhook события
- https://dashboard.stripe.com/logs - API логи

### Supabase Dashboard:
- Logs → API logs - проверить insert/update queries
- Database → Tables → individual_payments - проверить данные

---

## 🐛 Troubleshooting

### Ошибка: "Cannot find module 'stripe'"
```bash
npm install stripe @stripe/stripe-js
```

### Ошибка: "Invalid API key"
- Проверить что ключ начинается с `sk_live_`
- Проверить что `.env.local` загружен (перезапустить сервер)

### Ошибка: "Webhook signature verification failed"
- Проверить STRIPE_WEBHOOK_SECRET
- Убедиться что используется правильный endpoint URL
- Проверить что webhook настроен в Live mode

### Payment успешный, но listing не создаётся:
1. Проверить webhook logs в Stripe Dashboard
2. Проверить Supabase logs
3. Проверить RLS policies на individual_payments
4. Проверить SUPABASE_SERVICE_ROLE_KEY

### Redirect на payment-success, но показывает error:
- Проверить что `/api/verify-payment` работает
- Проверить network tab в DevTools
- Проверить session_id в URL

---

## 💰 Pricing

**Current: $10.00 per listing**

Изменить цену:
```typescript
// src/components/individual/PaymentConfirmModal.tsx
// Line ~280 (в handleConfirm):
amount: 1000, // ← Change to desired amount in cents
              // 1000 = $10.00
              // 500 = $5.00
              // 1500 = $15.00
```

---

## ✅ Final Checklist

Before going live:
- [ ] Stripe Live keys настроены
- [ ] Webhook endpoint создан и активен
- [ ] SUPABASE_SERVICE_ROLE_KEY добавлен
- [ ] IS_FREE_TRIAL = false
- [ ] .env.local НЕ в git
- [ ] Приложение задеплоено
- [ ] Протестировано с тестовой картой
- [ ] Webhook события приходят
- [ ] Payment записи создаются
- [ ] Listings активируются
- [ ] Email подтверждения работают (Stripe)

---

**Готово! Платёжная система на Live режиме! 💳✅**

Вопросы? Проверьте:
- Stripe Dashboard → Logs
- Supabase Dashboard → Logs
- Browser DevTools → Network tab
