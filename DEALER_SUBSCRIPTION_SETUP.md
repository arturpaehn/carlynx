# Dealer Subscription System - Stage 2 Complete! 🎉

## ✅ Что создано:

### 1. **Subscription Page** (`/dealer/subscription`)
- ✅ Загрузка тарифов из БД
- ✅ Показ текущей подписки дилера
- ✅ Выбор тарифного плана
- ✅ Интеграция со Stripe Checkout
- ✅ 7-дневный триал автоматически

### 2. **API: Create Subscription** (`/api/dealer/create-subscription`)
- ✅ Проверка user_type (только dealers)
- ✅ Создание Stripe Customer (если нет)
- ✅ Отмена старой подписки (если есть)
- ✅ Создание Stripe Checkout Session
- ✅ 7-дневный триал включен
- ✅ Обновление dealers table сразу (trial status)

### 3. **API: Stripe Webhooks** (`/api/dealer/webhooks/stripe`)
- ✅ checkout.session.completed
- ✅ customer.subscription.created
- ✅ customer.subscription.updated
- ✅ customer.subscription.deleted
- ✅ customer.subscription.trial_will_end
- ✅ invoice.payment_failed
- ✅ invoice.payment_succeeded
- ✅ Обновление dealers table (subscription_status, dates)

---

## 🔧 Настройки (необходимо добавить в `.env.local`):

```bash
# Base URL приложения
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Stripe Webhook Secret для dealer подписок
# Получить здесь: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET_DEALER=whsec_xxxxxxxxxxxxx
```

---

## 📝 Настройка Stripe Webhook:

### Шаг 1: Создать Webhook Endpoint в Stripe Dashboard
1. Зайти: https://dashboard.stripe.com/webhooks
2. Нажать: **"Add endpoint"**
3. **Endpoint URL**: `https://carlynx.us/api/dealer/webhooks/stripe`
   - Для локальной разработки: `http://localhost:3000/api/dealer/webhooks/stripe`
   - Или использовать Stripe CLI для тестирования
4. **Description**: `Dealer Subscriptions`

### Шаг 2: Выбрать события (Select events to listen to):
Выбрать следующие события:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`
- ✅ `invoice.payment_failed`
- ✅ `invoice.payment_succeeded`

### Шаг 3: Скопировать Signing Secret
1. После создания webhook, скопировать **"Signing secret"**
2. Добавить в `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET_DEALER=whsec_...ваш_секрет...
   ```

---

## 🧪 Локальное тестирование с Stripe CLI:

### Установить Stripe CLI:
```bash
# Windows (Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Или скачать: https://github.com/stripe/stripe-cli/releases
```

### Login в Stripe:
```bash
stripe login
```

### Проброс webhook на localhost:
```bash
stripe listen --forward-to localhost:3000/api/dealer/webhooks/stripe --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.trial_will_end,invoice.payment_failed,invoice.payment_succeeded
```

Команда выведет **webhook secret**:
```
> Ready! Your webhook signing secret is whsec_...
```

Скопируйте его в `.env.local` как `STRIPE_WEBHOOK_SECRET_DEALER`

---

## 🎯 Как протестировать:

### 1. Добавить переменные в `.env.local`:
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
STRIPE_WEBHOOK_SECRET_DEALER=whsec_xxxxx
```

### 2. Перезапустить сервер:
```bash
npm run dev
```

### 3. Зайти как dealer:
1. Зарегистрироваться как dealer
2. Перейти: `/dealer/subscription`
3. Выбрать план (например, Tier 100 - $400/month)
4. Кликнуть "Select Plan"

### 4. Stripe Checkout:
- Откроется Stripe Checkout страница
- **Триал**: 7 дней бесплатно
- **Тестовая карта**: `4242 4242 4242 4242`, CVC: любые 3 цифры, дата: будущая

### 5. После успешной оплаты:
- Redirect на `/dealer/subscription?success=true`
- Статус в БД: `subscription_status = 'trial'`
- `trial_end_date` = через 7 дней

---

## 📊 Проверка в БД:

```sql
-- Проверить subscription дилера
SELECT 
  user_id,
  current_tier_id,
  subscription_status,
  trial_end_date,
  subscription_start_date,
  subscription_end_date,
  stripe_customer_id,
  stripe_subscription_id
FROM dealers
WHERE user_id = 'your-user-id';
```

---

## 🔄 Что происходит автоматически:

### При выборе плана:
1. `/api/dealer/create-subscription` создает Checkout Session
2. Dealer перенаправляется на Stripe Checkout
3. В БД сразу ставится `subscription_status = 'trial'`, `trial_end_date = +7 дней`

### При завершении оформления (Checkout completed):
4. Webhook `checkout.session.completed` → лог
5. Webhook `customer.subscription.created` → обновление БД

### Во время триала:
- `subscription_status = 'trial'`
- Dealer может добавлять listings (согласно лимиту тарифа)
- За 3 дня до окончания триала: webhook `trial_will_end`

### После окончания триала (через 7 дней):
- Stripe автоматически списывает оплату
- Webhook `invoice.payment_succeeded` → `subscription_status = 'active'`
- Или если оплата не прошла: `invoice.payment_failed` → `subscription_status = 'past_due'`

### При отмене подписки:
- Webhook `customer.subscription.deleted` → `subscription_status = 'canceled'`

---

## 🚨 Возможные ошибки:

### 1. "No checkout URL received"
- **Причина**: Не указан `NEXT_PUBLIC_BASE_URL` в `.env.local`
- **Решение**: Добавить переменную и перезапустить сервер

### 2. "Invalid signature" в webhook
- **Причина**: Неверный `STRIPE_WEBHOOK_SECRET_DEALER`
- **Решение**: Проверить secret в Stripe Dashboard

### 3. "User profile not found"
- **Причина**: Пользователь не зарегистрирован или нет в `user_profiles`
- **Решение**: Зарегистрироваться заново

---

## 📈 Следующий этап (STAGE 3):

Теперь можно приступать к:
- [ ] `/dealer/add-listing` - bulk добавление listings
- [ ] `/dealer/my-listings` - управление listings
- [ ] Проверка лимитов подписки при добавлении
- [ ] Reactivation функционал

---

## 💡 Полезные команды:

```bash
# Проверить все подписки в Stripe
stripe subscriptions list

# Отменить подписку вручную (тест)
stripe subscriptions cancel sub_xxxxx

# Посмотреть webhook events
stripe events list --limit 10
```

---

**🎉 ЭТАП 2 ЗАВЕРШЁН!** Подписки работают с триалом, Stripe интеграция готова!
