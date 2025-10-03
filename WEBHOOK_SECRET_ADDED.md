# ✅ Stripe Webhook Secret добавлен!

## Что сделано:

### 1. Добавлен STRIPE_WEBHOOK_SECRET в .env.local
```env
STRIPE_WEBHOOK_SECRET=whsec_6KDDAfCBbSZeUZ9Rk2LltXT9ycGq3ury
```

---

## 🚀 Следующие шаги:

### 1. Перезапустить dev сервер (ВАЖНО!)

**⚠️ Новые env переменные загружаются только при старте сервера!**

```powershell
# Найдите терминал с запущенным npm run dev
# Остановите сервер: Ctrl+C

# Перезапустите:
npm run dev
```

### 2. Активировать платный режим

Открыть файл:
```
src/components/individual/PaymentConfirmModal.tsx
```

**Изменить строку 7:**
```typescript
const IS_FREE_TRIAL = false;  // ← Изменить с true на false
```

### 3. Протестировать полный flow

**3.1. Создать объявление:**
1. http://localhost:3000
2. Login (или Register)
3. Add Listing
4. Заполнить все поля (Title, Year, Price, Brand, etc.)
5. Submit

**3.2. Payment Modal должна показать:**
- ✅ **"Proceed to Payment"** (синяя кнопка)
- ✅ Цена: **$10.00**
- ❌ **НЕТ** зелёного баннера "FREE"

**3.3. Клик "Proceed to Payment":**
- Redirect на Stripe Checkout
- URL: https://checkout.stripe.com/...

**3.4. Ввести тестовую карту:**
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

**3.5. После оплаты:**
- ✅ Redirect на `/payment-success`
- ✅ Зелёная галочка "Payment Successful!"
- ✅ Auto-redirect на `/my-listings` через 3 сек

---

## 🔍 Проверка webhook

### Stripe Dashboard:
https://dashboard.stripe.com/webhooks

**Должно быть:**
- ✅ Endpoint: `https://carlynx.us/api/webhooks/stripe` (или localhost для тестов)
- ✅ Status: **Enabled**
- ✅ Events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
- ✅ Signing secret: `whsec_6KDD...` (уже добавлен)

**После тестового платежа:**
- ✅ В списке событий появится `checkout.session.completed`
- ✅ Status: ✓ Succeeded (зелёная галочка)

---

## 📊 Проверка в БД

### Supabase Dashboard:
https://supabase.com/dashboard

**SQL Editor → New Query:**
```sql
-- Проверить payment записи
SELECT 
  payment_id,
  user_id,
  payment_status,
  stripe_payment_intent_id,
  stripe_session_id,
  amount,
  paid_at,
  created_at
FROM individual_payments
WHERE payment_status = 'succeeded'
ORDER BY created_at DESC
LIMIT 5;

-- Проверить listings
SELECT 
  id,
  title,
  payment_status,
  payment_id,
  is_active,
  created_at
FROM listings
WHERE payment_status = 'paid'
ORDER BY created_at DESC
LIMIT 5;
```

**Должно быть:**
- ✅ `payment_status = 'succeeded'`
- ✅ `stripe_payment_intent_id = 'pi_xxxxx'`
- ✅ `stripe_session_id = 'cs_xxxxx'`
- ✅ Listing с `payment_status = 'paid'`

---

## 🐛 Troubleshooting

### Webhook не работает (локально):

**Проблема:** Stripe не может достучаться до localhost

**Решение:** Использовать Stripe CLI для форварда webhook:
```powershell
# Установить Stripe CLI:
# https://github.com/stripe/stripe-cli/releases

# Логин
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Скопировать whsec_ и обновить .env.local
# Перезапустить npm run dev
```

### Ошибка: "Invalid webhook signature"

**Решение:**
1. Проверить что `STRIPE_WEBHOOK_SECRET` правильный
2. Перезапустить сервер после изменения .env.local
3. Проверить что webhook endpoint URL совпадает

### Payment проходит, но listing не создаётся:

**Решение:**
1. Проверить Stripe Dashboard → Webhooks → Events
2. Проверить что webhook вернул 200 (не 500)
3. Проверить `SUPABASE_SERVICE_ROLE_KEY` в .env.local
4. Проверить логи в терминале где запущен `npm run dev`

---

## ✅ Checklist перед тестированием:

- [ ] `STRIPE_WEBHOOK_SECRET` добавлен в `.env.local`
- [ ] Dev сервер перезапущен (`npm run dev`)
- [ ] `IS_FREE_TRIAL = false` в `PaymentConfirmModal.tsx`
- [ ] Залогинен в приложении
- [ ] Stripe Dashboard открыт (для мониторинга)
- [ ] Supabase Dashboard открыт (для проверки БД)

---

## 🎯 Следующий шаг:

**Перезапустите сервер прямо сейчас:**
```powershell
# В терминале с npm run dev нажмите Ctrl+C
# Затем:
npm run dev
```

**Потом измените `IS_FREE_TRIAL = false` и протестируйте!**

---

**Готово! Webhook secret настроен. Осталось перезапустить сервер и протестировать.** 🎉
