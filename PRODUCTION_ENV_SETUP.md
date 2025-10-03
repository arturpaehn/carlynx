# 🚀 Production Environment Setup (Vercel)

## Вариант 1: Через Vercel Dashboard (рекомендуется)

### 1. Открыть проект на Vercel
https://vercel.com/dashboard

### 2. Выбрать проект CarLynx

### 3. Перейти в Settings → Environment Variables

### 4. Добавить переменные окружения:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kjntriyhqpfxqciaxbpj.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` (from Stripe Dashboard) | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` (from Stripe Dashboard) | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (после настройки webhook) | Production |

### 5. Сохранить и Redeploy
- Кликнуть **"Save"** для каждой переменной
- Перейти в **Deployments** → **Redeploy**

---

## Вариант 2: Через Vercel CLI

### 1. Установить Vercel CLI (если не установлен)
```powershell
npm install -g vercel
```

### 2. Залинковать проект
```powershell
vercel link
```

**Ответить на вопросы:**
```
? Set up and deploy "~/Documents/carlynx-0.6.0"? [Y/n] y
? Which scope do you want to deploy to? <your-username>
? Link to existing project? [Y/n] y
? What's the name of your existing project? carlynx
```

### 3. Добавить переменные через CLI
```powershell
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://kjntriyhqpfxqciaxbpj.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste anon key from .env.local

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste service role key from .env.local

# Stripe
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste: pk_live_... (from Stripe Dashboard)

vercel env add STRIPE_SECRET_KEY production
# Paste: sk_live_... (from Stripe Dashboard)

# Webhook Secret (добавить после настройки webhook)
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_... (from Stripe Dashboard)
```

### 4. Задеплоить
```powershell
vercel --prod
```

---

## Вариант 3: Через .env файл (одной командой)

### 1. Создать файл со всеми переменными
```powershell
# В корне проекта (не коммитить!)
@"
NEXT_PUBLIC_SUPABASE_URL=https://kjntriyhqpfxqciaxbpj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbnRyaXlocXBmeHFjaWF4YnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NzI4NjcsImV4cCI6MjA0NjA0ODg2N30.NmTQ1jb2M8vXQXLEI87BQKxYdnv4tXBXWzr-r2TbwGI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbnRyaXlocXBmeHFjaWF4YnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDQ3Mjg2NywiZXhwIjoyMDQ2MDQ4ODY3fQ.5EBg5a5gsvQ11BvTHbAi1xrLT2-0vk3Ue-_k2uqF3MQ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_... (from Stripe Dashboard)
"@ | Out-File -FilePath .env.production -Encoding UTF8
```

### 2. Загрузить в Vercel
```powershell
vercel env pull .env.production production
```

---

## ⚠️ ВАЖНО: Webhook Secret

**Stripe Webhook Secret** можно получить только **ПОСЛЕ** деплоя на продакшн:

### Шаги:
1. **Задеплоить** проект на Vercel (без webhook secret пока)
2. **Получить production URL**: `https://carlynx.vercel.app` (или ваш домен)
3. **Настроить webhook в Stripe**:
   - https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://carlynx.vercel.app/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
   - **Copy signing secret** (начинается с `whsec_`)
4. **Добавить в Vercel**:
   - Dashboard → Environment Variables → Add `STRIPE_WEBHOOK_SECRET`
   - Или: `vercel env add STRIPE_WEBHOOK_SECRET production`
5. **Redeploy** проект

---

## 🔒 Security Checklist

- [ ] Все переменные добавлены в **Production environment** (не Preview/Development)
- [ ] `STRIPE_SECRET_KEY` НЕ имеет префикс `NEXT_PUBLIC_`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` НЕ имеет префикс `NEXT_PUBLIC_`
- [ ] Webhook URL использует **HTTPS** (не HTTP)
- [ ] Webhook secret добавлен после настройки endpoint
- [ ] `.env.local` и `.env.production` в `.gitignore`

---

## 📋 Быстрый чеклист

### Первый деплой (без webhook):
```powershell
# 1. Залинковать проект
vercel link

# 2. Добавить основные переменные (5 штук)
# (см. команды выше)

# 3. Задеплоить
vercel --prod
```

### После деплоя (добавить webhook):
```powershell
# 4. Настроить webhook в Stripe Dashboard
# URL: https://ваш-домен.vercel.app/api/webhooks/stripe

# 5. Добавить webhook secret
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_...

# 6. Redeploy
vercel --prod
```

---

## 🧪 Проверка после деплоя

### 1. Проверить переменные окружения:
```powershell
vercel env ls
```

Должно быть 6 переменных в **Production**:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_WEBHOOK_SECRET

### 2. Проверить работу API endpoints:
```powershell
# Health check (должен вернуть 200)
curl https://carlynx.vercel.app/api/webhooks/stripe -X GET

# Create checkout session (должен вернуть sessionId)
curl https://carlynx.vercel.app/api/create-checkout-session -X POST `
  -H "Content-Type: application/json" `
  -d '{"amount":10,"listingTitle":"Test","userId":"...","userEmail":"test@example.com"}'
```

### 3. Тест полного flow:
1. Открыть https://carlynx.vercel.app
2. Login
3. Add Listing → Submit
4. Payment Modal → "Proceed to Payment"
5. Stripe Checkout → Pay with test card `4242 4242 4242 4242`
6. Redirect на `/payment-success`
7. Check Stripe Dashboard → Payment должен быть `succeeded`

---

## 🐛 Troubleshooting

**Vercel env add не работает:**
→ Сначала выполнить `vercel link`

**Переменные не обновились:**
→ Обязательно сделать **Redeploy** после добавления переменных

**Webhook возвращает 500:**
→ Проверить что `STRIPE_WEBHOOK_SECRET` добавлен в Production
→ Проверить логи: `vercel logs --follow`

**Payment не проходит на проде:**
→ Проверить что используются **Live keys** (pk_live_, sk_live_)
→ Проверить что `IS_FREE_TRIAL = false` в PaymentConfirmModal.tsx

---

## 📚 Дополнительно

**Vercel docs:**
https://vercel.com/docs/concepts/projects/environment-variables

**Stripe webhook testing:**
https://stripe.com/docs/webhooks/test

**Supabase environment variables:**
https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

**Рекомендация:** Используйте **Вариант 1 (Dashboard)** - самый простой и визуальный способ.
