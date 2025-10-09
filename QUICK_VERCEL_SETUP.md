# 🚀 Quick Start - Vercel Setup (5 минут)

## 1️⃣ Генерация CRON_SECRET

**PowerShell:**
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Скопируй результат!

## 2️⃣ Добавить в Vercel

1. Открыть: https://vercel.com/arturpaehn/carlynx/settings/environment-variables
2. Нажать "Add New"
3. Вставить:
   ```
   Key: CRON_SECRET
   Value: [твой_секрет]
   Environments: ✓ All (Production, Preview, Development)
   ```
4. Save

## 3️⃣ Редеплой

1. https://vercel.com/arturpaehn/carlynx/deployments
2. Последний деплой → ⋯ → Redeploy
3. Дождаться ✅ Ready

## 4️⃣ Запустить СЕЙЧАС

1. https://vercel.com/arturpaehn/carlynx/settings/crons
2. Найти `/api/cron/sync-mars-dealership`
3. Нажать "Run Now"
4. Дождаться завершения (~60 сек)

## 5️⃣ Проверить результат

Открыть: https://carlynx.us/

Искать: ⭐ **Partner** бейдж на объявлениях

## ✅ Готово!

Автоматическая синхронизация: **Каждый день в 5 PM Estonian Time**

---

**Полная инструкция:** `VERCEL_SETUP_GUIDE.md`
