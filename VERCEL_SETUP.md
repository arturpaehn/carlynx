# ⚠️ ВАЖНО: Добавьте переменную окружения в Vercel

## Для работы отправки email на продакшене:

1. Зайдите в Vercel Dashboard: https://vercel.com/arturpaehn/carlynx
2. Settings → Environment Variables
3. Добавьте новую переменную:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_5GV7mBZ6_5Zk2ReoQEEVqvCVWLsyQpiv3`
   - **Environment**: Production, Preview, Development (выберите все)
4. Нажмите "Save"
5. Redeploy приложение

## 🎯 Готово!

Теперь форма "Contact Support" в футере будет:
- ✅ Отправлять реальные письма на `support@carlynx.us`
- ✅ Работать на localhost (dev)
- ✅ Работать на продакшене (после добавления в Vercel)

## 📧 Тестирование

1. Откройте http://localhost:3000
2. Прокрутите вниз до футера
3. Нажмите "Contact Support"
4. Заполните форму и отправьте
5. Проверьте почту `support@carlynx.us` - письмо должно прийти в течение 1-2 секунд!

**Письмо будет содержать:**
- От кого (email пользователя)
- Тему
- Сообщение
- Timestamp
- Красивое HTML форматирование

**Reply-To** автоматически установлен на email пользователя, так что вы сможете просто нажать "Ответить" в почтовом клиенте.
