# ✅ Цена изменена с $10 на $5

## Что было изменено:

### 1. PaymentConfirmModal.tsx
**Файл:** `src/components/individual/PaymentConfirmModal.tsx`

**Строка 55:**
```typescript
// Было:
const LISTING_PRICE = 10; // USD per listing

// Стало:
const LISTING_PRICE = 5; // USD per listing
```

### 2. Английская локализация
**Файл:** `public/locales/en/common.json`

**Строка 315:**
```json
// Было:
"freeTrialDescription": "List your vehicle absolutely FREE during our launch period. Normally $10 per listing."

// Стало:
"freeTrialDescription": "List your vehicle absolutely FREE during our launch period. Normally $5 per listing."
```

### 3. Испанская локализация
**Файл:** `public/locales/es/common.json`

**Строка 361:**
```json
// Было:
"freeTrialDescription": "Publique su vehículo absolutamente GRATIS durante nuestro período de lanzamiento. Normalmente $10 por anuncio."

// Стало:
"freeTrialDescription": "Publique su vehículo absolutamente GRATIS durante nuestro período de lanzamiento. Normalmente $5 por anuncio."
```

---

## Как будет выглядеть:

### FREE TRIAL режим (IS_FREE_TRIAL = true):
```
🎉 Limited Time Offer - FREE!
List your vehicle absolutely FREE during our launch period. Normally $5 per listing.
```

### PAID режим (IS_FREE_TRIAL = false):
```
Confirm Listing & Payment

Total: $5 USD
One-time payment for 30 days

[Proceed to Payment]
```

---

## Stripe Checkout:

При переходе в Stripe Checkout будет создаваться сессия с ценой:
```typescript
amount: 500, // $5.00 в центах (было 1000)
```

**Это автоматически рассчитывается из:**
```typescript
LISTING_PRICE * 100 = 5 * 100 = 500 центов
```

---

## Проверка:

### 1. Локально (Free Trial):
```bash
npm run dev
```

1. Открыть http://localhost:3000/add-listing
2. Заполнить форму
3. Submit
4. В модальном окне должно быть: **"Normally $5 per listing"**

### 2. С платежами (после активации):

**Изменить в `PaymentConfirmModal.tsx`:**
```typescript
const IS_FREE_TRIAL = false;
```

**Перезапустить:**
```bash
npm run dev
```

**Проверить:**
1. Add Listing → Submit
2. Modal должен показать: **"Total: $5 USD"**
3. Клик "Proceed to Payment"
4. Stripe Checkout покажет: **$5.00 USD**

---

## Документация (нужно обновить):

Следующие файлы упоминают $10 и должны быть обновлены для консистентности:

1. `STRIPE_LIVE_SETUP.md` - строки 158, 207, 307, 314
2. `STRIPE_QUICK_START.md` - строки 80, 106
3. `WEBHOOK_SECRET_ADDED.md` - строка 49
4. `PAYMENT_SYSTEM_ARCHITECTURE.md` - строки 7, 251, 279
5. `PAYMENT_MIGRATION_INSTRUCTIONS.md` - строка 113

**Примеры изменений для документации:**

```markdown
# Было:
✅ Цена: **$10.00**

# Стало:
✅ Цена: **$5.00**
```

```markdown
# Было:
**Current: $10.00 per listing**

# Стало:
**Current: $5.00 per listing**
```

```markdown
# Было:
amount: 1000, // $10.00 in cents

# Стало:
amount: 500, // $5.00 in cents
```

---

## SQL проверка (после платежа):

```sql
-- Проверить сумму в БД
SELECT 
  payment_id,
  amount,
  currency,
  payment_status
FROM individual_payments
WHERE payment_status = 'succeeded'
ORDER BY created_at DESC
LIMIT 1;

-- Должно быть: amount = 5.00
```

---

## Stripe Dashboard проверка:

После тестового платежа:
1. https://dashboard.stripe.com/payments
2. Последний платёж должен быть: **$5.00 USD**
3. Description: "CarLynx Vehicle Listing"

---

## Краткий чеклист:

- [x] `PaymentConfirmModal.tsx` - LISTING_PRICE = 5
- [x] `public/locales/en/common.json` - $5 per listing
- [x] `public/locales/es/common.json` - $5 por anuncio
- [ ] Обновить документацию (*.md файлы) - опционально
- [ ] Протестировать модальное окно
- [ ] Протестировать Stripe Checkout (если IS_FREE_TRIAL = false)

---

**Готово! Цена изменена с $10 на $5 во всех необходимых местах.** ✅
