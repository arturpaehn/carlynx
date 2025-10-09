# 🚀 Quick Start - Vercel Setup (5 минут)

## 1️⃣ Генерация CRON_SECRET

**⚠️ ВАЖНО: Используй HEX формат (не base64)!**

**В терминале VS Code (Ctrl + `) или Windows PowerShell (Win + X):**
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
-join ($bytes | ForEach-Object { $_.ToString("x2") })
```

Скопируй результат! (64 символа без `+` и `=`)

## 2️⃣ Добавить переменные в Vercel

1. Открыть: https://vercel.com/arturpaehn/carlynx/settings/environment-variables
2. Добавить **3 переменные**:

**Переменная 1:**
```
Key: CRON_SECRET
Value: [твой_hex_секрет_из_шага_1]
Environments: ✓ Production (ТОЛЬКО!)
```

**Переменная 2:**
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://kjntriyhqpfxqciaxbpj.supabase.co
Environments: ✓ Production
```

**Переменная 3:**
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [service_role_key_из_Supabase_Dashboard]
Environments: ✓ Production
```

⚠️ **Где взять service_role key:**
- Supabase Dashboard → Settings → API → service_role (НЕ anon!)

3. Save все 3 переменные

## 3️⃣ Редеплой

1. https://vercel.com/arturpaehn/carlynx/deployments
2. Последний деплой → ⋯ → Redeploy
3. Дождаться ✅ Ready

## 4️⃣ Запустить ВРУЧНУЮ (тест)

⚠️ **Vercel Crons UI недоступен**, используй PowerShell:

```powershell
Invoke-RestMethod -Uri "https://carlynx.us/api/cron/sync-mars-dealership" -Method Get -Headers @{"x-cron-secret"="ТВОЙ_СЕКРЕТ"}
```

Замени `ТВОЙ_СЕКРЕТ` на значение из шага 1.

Ожидай: 30-60 секунд, ответ:
```json
{
  "success": true,
  "message": "Mars Dealership sync completed",
  "timestamp": "..."
}
```

## 5️⃣ Проверить результат

Открыть: https://carlynx.us/

Искать: ⭐ **Partner** бейдж на объявлениях

## ✅ Готово!

Автоматическая синхронизация: **Каждый день в 5 PM Estonian Time**

---

**Полная инструкция:** `VERCEL_SETUP_GUIDE.md`
