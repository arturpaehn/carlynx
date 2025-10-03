# ✅ Stripe Live Keys Configured!

## Что уже сделано:

✅ Stripe SDK установлен (`stripe`, `@stripe/stripe-js`)  
✅ Live API ключи добавлены в `.env.local`  
✅ `.env.local` в `.gitignore` (не будет закоммичен)  
✅ Все API endpoints созданы:
  - `/api/create-checkout-session` - создание платежа
  - `/api/verify-payment` - проверка платежа
  - `/api/webhooks/stripe` - webhook от Stripe
✅ Страница `/payment-success` создана

## 🚀 Следующие шаги:

### 1. Активировать платный режим (30 секунд)

Открыть файл: `src/components/individual/PaymentConfirmModal.tsx`

**Найти строку 7:**
```typescript
const IS_FREE_TRIAL = true;
```

**Изменить на:**
```typescript
const IS_FREE_TRIAL = false;
```

### 2. Настроить Webhook в Stripe (5 минут)

⚠️ **ВАЖНО:** Webhook нужен для подтверждения платежей!

**Шаги:**
1. Открыть https://dashboard.stripe.com/webhooks
2. Убедиться что в **Live mode** (переключатель справа вверху)
3. Кликнуть **"Add endpoint"**

**Настройки:**
```
Endpoint URL: https://carlynx.us/api/webhooks/stripe
(замените на ваш домен)

Description: CarLynx Payment Webhooks

Events to send (выбрать 4 события):
☑ checkout.session.completed
☑ payment_intent.succeeded  
☑ payment_intent.payment_failed
☑ charge.refunded
```

4. Кликнуть **"Add endpoint"**
5. Скопировать **"Signing secret"** (начинается с `whsec_`)
6. Открыть `.env.local` и вставить:

```env
STRIPE_WEBHOOK_SECRET=whsec_ВАШ_СКОПИРОВАННЫЙ_SECRET
```

### 3. Перезапустить сервер

```bash
# Ctrl+C чтобы остановить текущий сервер
npm run dev
```

### 4. Протестировать платёж

**4.1. Создать объявление:**
- http://localhost:3000
- Login
- Add Listing
- Заполнить форму
- Submit

**4.2. Должна появиться Payment Modal:**
- ❌ БЕЗ зелёного баннера "FREE"
- ✅ Кнопка "Proceed to Payment" (синяя)
- ✅ Цена: $10.00

**4.3. Клик "Proceed to Payment":**
- Перенаправит на Stripe Checkout
- Secure страница (https://checkout.stripe.com/...)

**4.4. Ввести тестовую карту:**

```
Card: 4242 4242 4242 4242
Expiry: 12/34 (любая будущая дата)
CVC: 123
ZIP: 12345
```

> **Note:** Stripe Test Mode позволяет тестовые карты даже на Live keys

**4.5. После оплаты:**
- ✅ Redirect на `/payment-success`
- ✅ Зелёная галочка
- ✅ Auto-redirect на `/my-listings`

### 5. Проверить результат

**В Stripe Dashboard:**
https://dashboard.stripe.com/payments
- Должен появиться платёж $10.00
- Status: Succeeded

**В Supabase Database:**
```sql
SELECT * FROM individual_payments 
WHERE payment_status = 'succeeded'
ORDER BY created_at DESC LIMIT 1;
```

---

## 🔒 Security

✅ `.env.local` НЕ в git  
✅ Live keys защищены  
✅ Webhook signature verification включена  
✅ RLS policies активны

---

## 📊 Current Setup

| Item | Status |
|------|--------|
| Stripe SDK | ✅ Installed |
| Live Keys | ✅ Configured |
| API Endpoints | ✅ Created |
| Payment Modal | ⏳ Ready (change IS_FREE_TRIAL) |
| Webhook | ⏳ Need to configure |
| SSL/HTTPS | ⚠️ Required for production |

---

## ⚠️ Production Checklist

Before deploying:
- [ ] Change `IS_FREE_TRIAL = false`
- [ ] Configure webhook endpoint
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
- [ ] Test with test card 4242...
- [ ] Deploy to production
- [ ] Update webhook URL to production domain
- [ ] Test full flow on production

---

## 🐛 Troubleshooting

**Modal still says "FREE"?**
→ Change `IS_FREE_TRIAL = false` and restart server

**Webhook not working?**
→ Check `STRIPE_WEBHOOK_SECRET` in `.env.local`
→ Check events selected in Stripe Dashboard

**Payment succeeds but listing not created?**
→ Check webhook logs in Stripe Dashboard
→ Check Supabase logs
→ Verify `SUPABASE_SERVICE_ROLE_KEY`

---

**Готово! Осталось только:**
1. Изменить `IS_FREE_TRIAL = false`
2. Настроить webhook
3. Перезапустить сервер

**Вопросы?** См. `STRIPE_LIVE_SETUP.md` для полной документации.
