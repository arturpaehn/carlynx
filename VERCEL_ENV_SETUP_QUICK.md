# 🚀 Quick Vercel Environment Variables Setup

## ⚠️ СРОЧНО: Без этих переменных сайт не работает!

Ошибка **500 в create-checkout-session** означает что `STRIPE_SECRET_KEY` не установлен.

## Способ 1: Через Vercel Dashboard (3 минуты)

### Шаг 1: Открыть проект
https://vercel.com/dashboard → Выбрать проект **carlynx**

### Шаг 2: Settings → Environment Variables

### Шаг 3: Добавить 5 переменных (одну за другой)

#### 1️⃣ NEXT_PUBLIC_SUPABASE_URL
```
Value: https://kjntriyhqpfxqciaxbpj.supabase.co
Environment: Production ✓
```

#### 2️⃣ NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbnRyaXlocXBmeHFjaWF4YnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NzI4NjcsImV4cCI6MjA0NjA0ODg2N30.NmTQ1jb2M8vXQXLEI87BQKxYdnv4tXBXWzr-r2TbwGI
Environment: Production ✓
```

#### 3️⃣ SUPABASE_SERVICE_ROLE_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbnRyaXlocXBmeHFjaWF4YnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDQ3Mjg2NywiZXhwIjoyMDQ2MDQ4ODY3fQ.5EBg5a5gsvQ11BvTHbAi1xrLT2-0vk3Ue-_k2uqF3MQ
Environment: Production ✓
```

#### 4️⃣ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
Value: (ваш pk_live_... ключ из .env.local)
Environment: Production ✓
```

#### 5️⃣ STRIPE_SECRET_KEY
```
Value: (ваш sk_live_... ключ из .env.local)
Environment: Production ✓
```

### Шаг 4: Redeploy
После добавления всех 5 переменных:
- Перейти в **Deployments**
- Кликнуть на последний деплой
- Нажать **"Redeploy"**

---

## Способ 2: Через .env.local файл (быстрее)

### Скопировать из локального файла:

```powershell
# В корне проекта открыть .env.local
cat .env.local
```

Скопировать значения и вставить в Vercel Dashboard по одной переменной.

---

## 📋 Checklist

После добавления проверить:
- [ ] Все 5 переменных добавлены
- [ ] Environment выбран **Production**
- [ ] Redeploy выполнен
- [ ] Deployment завершился успешно (✓ зелёная галочка)
- [ ] Открыть сайт и попробовать создать листинг

---

## 🐛 Troubleshooting

### Ошибка: "STRIPE_SECRET_KEY is not set"
→ Переменная не добавлена или неправильный Environment
→ Проверить: Settings → Environment Variables → Production

### Ошибка: "Failed to create checkout session"
→ Неправильный формат Stripe ключа
→ Проверить что ключ начинается с `sk_live_...`

### Ошибка: "Supabase client not initialized"
→ Supabase переменные не добавлены
→ Добавить все 3 Supabase переменные

### После добавления переменных ничего не изменилось
→ **ОБЯЗАТЕЛЬНО сделать Redeploy!**
→ Vercel применяет env vars только при новом deploy

---

## ✅ Результат

После настройки должно работать:
1. ✅ Создание листинга
2. ✅ Redirect на Stripe Checkout
3. ✅ Оплата $5
4. ✅ Активация листинга
5. ✅ Redirect на /my-listings

---

## 🔐 Безопасность

- ❌ НЕ коммитить эти ключи в GitHub
- ✅ Хранить только в Vercel Environment Variables
- ✅ Использовать Live keys только для Production
- ✅ Test keys (sk_test_...) использовать для Development

---

**Время выполнения: 3 минуты**
**Сложность: Простая**
**Результат: Сайт полностью работает на продакшене**
