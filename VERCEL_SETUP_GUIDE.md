# 🚀 Vercel Deployment - Step-by-Step Guide

## ✅ Git Push Complete
Код уже запушен в GitHub. Vercel автоматически начнёт деплой.

---

## 📋 ПОШАГОВАЯ ИНСТРУКЦИЯ ДЛЯ VERCEL

### Шаг 1: Проверить деплой

1. **Открыть:** https://vercel.com/dashboard
2. **Найти проект:** `carlynx` (или ваше имя проекта)
3. **Дождаться:** Пока статус деплоя станет ✅ **Ready**

---

### Шаг 2: Добавить переменную окружения CRON_SECRET

**Важно!** Без этого секрета cron job не будет работать.

#### 2.1. Генерация секрета

**На Mac/Linux/WSL:**
```bash
openssl rand -base64 32
```

**На Windows PowerShell:**
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Или используй онлайн:**
https://generate-secret.vercel.app/32

**Скопируй результат!** Например: `K8Jx2Yv9Qm3Np7Rz5Tw1Hs6Df4Gu0Lp`

#### 2.2. Добавление в Vercel

1. **Открыть:** https://vercel.com/arturpaehn/carlynx/settings/environment-variables
   (Замени `arturpaehn/carlynx` на свой путь)

2. **Нажать:** "Add New" или "Add Variable"

3. **Заполнить:**
   ```
   Key:   CRON_SECRET
   Value: [вставь сгенерированный секрет]
   ```

4. **Environments:** Выбрать все 3:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

5. **Нажать:** "Save"

**Скриншот того, что должно получиться:**
```
Name                          Value                  Environments
CRON_SECRET                   K8Jx2Yv9Qm...         Production, Preview, Development
NEXT_PUBLIC_SUPABASE_URL      https://...           Production, Preview, Development
SUPABASE_SERVICE_ROLE_KEY     eyJhbGci...           Production, Preview, Development
STRIPE_SECRET_KEY             sk_live_...           Production, Preview, Development
...
```

---

### Шаг 3: Редеплой после добавления секрета

После добавления `CRON_SECRET` нужен редеплой:

1. **Открыть:** https://vercel.com/arturpaehn/carlynx/deployments
2. **Найти:** Последний деплой (самый верхний)
3. **Нажать:** на три точки ⋯ справа
4. **Выбрать:** "Redeploy"
5. **Подтвердить:** "Redeploy"
6. **Дождаться:** Статус ✅ Ready

---

### Шаг 4: Проверить Cron Job

После успешного деплоя:

1. **Открыть:** https://vercel.com/arturpaehn/carlynx/settings/crons
2. **Должно быть:**
   ```
   Path: /api/cron/sync-mars-dealership
   Schedule: 0 14 * * *
   Status: ✅ Active
   ```

**Что означает `0 14 * * *`:**
- Каждый день
- В 14:00 UTC (= 5 PM Estonian Time)

---

### Шаг 5: Тестовый запуск ПРЯМО СЕЙЧАС

Чтобы не ждать до 5 PM, запусти cron вручную:

#### Вариант A: Через Vercel Dashboard (проще)

1. **Открыть:** https://vercel.com/arturpaehn/carlynx/settings/crons
2. **Найти:** `/api/cron/sync-mars-dealership`
3. **Нажать:** "Run Now" или "Trigger"
4. **Дождаться:** Выполнения (~30-60 секунд)

#### Вариант B: Через curl (альтернатива)

**На PowerShell:**
```powershell
$secret = "ТВОЙ_CRON_SECRET"
curl -X GET "https://carlynx.us/api/cron/sync-mars-dealership" -H "Authorization: Bearer $secret"
```

**Замени:**
- `ТВОЙ_CRON_SECRET` - секрет из Vercel
- `carlynx.us` - твой домен

**Ожидаемый результат:**
```json
{
  "success": true,
  "message": "Mars Dealership sync completed",
  "timestamp": "2025-01-09T..."
}
```

---

### Шаг 6: Проверить логи

Чтобы увидеть что произошло:

1. **Открыть:** https://vercel.com/arturpaehn/carlynx/logs
2. **Фильтр:** Выбрать "Functions"
3. **Искать:** `/api/cron/sync-mars-dealership`

**Что должно быть в логах:**
```
🚀 Starting Mars Dealership sync...
⏰ Time: 1/9/2025, 2:00:00 PM (Estonian Time)
🔍 Fetching Mars Dealership listings...
📄 Fetching page 1...
  ✅ Found 10 listings on page 1
📄 Fetching page 2...
  ✅ Found 12 listings on page 2
...
✅ Total listings found: 44
🔄 Syncing 44 listings to database...
✅ Updated/Created listings...
🎉 Sync complete! Processed 44 listings
```

---

### Шаг 7: Проверить результат на сайте

1. **Открыть:** https://carlynx.us/
2. **Искать:** Объявления с бейджем **⭐ Partner**
3. **Проверить:** Счётчик в футере должен увеличиться на ~44

4. **Открыть поиск:** https://carlynx.us/search-results?vehicle_type=car&state_id=1
5. **Проверить:** Партнёрские объявления (Dallas, TX) с бейджем Partner

6. **Кликнуть на Partner объявление:**
   - Должно открыться в новой вкладке
   - URL: marsdealership.com

---

## 🔍 Troubleshooting

### Проблема: Cron не появился в Vercel

**Решение:**
- Проверь что файл `vercel.json` есть в корне проекта
- Сделай редеплой (Redeploy)

### Проблема: "Unauthorized" в логах

**Решение:**
- Проверь что `CRON_SECRET` добавлен в Environment Variables
- Значение должно быть БЕЗ кавычек
- Сделай редеплой после добавления

### Проблема: Не появляются Partner объявления на сайте

**Решение 1:** Проверь RLS policies в Supabase
```sql
-- В Supabase SQL Editor:
SELECT * FROM external_listings WHERE is_active = true LIMIT 5;
```

**Решение 2:** Проверь консоль браузера (F12)
- Не должно быть ошибок при загрузке

### Проблема: Cron выполнился, но ничего не синхронизировалось

**Проверь логи:**
1. Vercel Logs → Functions
2. Ищи ошибки красным цветом
3. Частые причины:
   - `SUPABASE_SERVICE_ROLE_KEY` не установлен
   - Mars Dealership изменил структуру HTML
   - RLS policies блокируют INSERT

---

## ✅ Чек-лист успешного деплоя

- [ ] Git push выполнен
- [ ] Vercel деплой завершён (✅ Ready)
- [ ] `CRON_SECRET` добавлен в Environment Variables
- [ ] Редеплой после добавления секрета
- [ ] Cron появился в Settings → Crons
- [ ] Тестовый запуск выполнен (Run Now)
- [ ] В логах видно "Sync complete! Processed 44 listings"
- [ ] На главной странице появились Partner объявления
- [ ] Счётчик в футере увеличился
- [ ] Поиск показывает партнёрские объявления
- [ ] Клик на Partner объявление открывает marsdealership.com

---

## 📅 График синхронизации

**Автоматическая синхронизация:**
- Каждый день в **5:00 PM Estonian Time (EET)**
- Это **14:00 UTC** (зимой) или **13:00 UTC** (летом)
- Длительность: ~30-60 секунд
- Обновляет/добавляет ~44 объявления

**Следующий запуск:** Завтра в 5 PM

---

## 🎉 Готово!

После выполнения всех шагов Mars Dealership интеграция работает в продакшене!

**Мониторинг:**
- Логи: https://vercel.com/arturpaehn/carlynx/logs
- Cron статус: https://vercel.com/arturpaehn/carlynx/settings/crons
- База данных: Supabase Dashboard → Table Editor → external_listings

**Вопросы?** Проверь `MARS_DEALERSHIP_INTEGRATION.md`
