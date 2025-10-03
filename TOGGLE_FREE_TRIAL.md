# 🔄 Переключение режима FREE TRIAL / PAID

## 📍 Файл для изменения:
```
src/components/individual/PaymentConfirmModal.tsx
```

---

## 🆓 БЕСПЛАТНЫЙ РЕЖИМ (Free Trial)

### Изменить строку 7:
```typescript
const IS_FREE_TRIAL = true; // ← БЕСПЛАТНЫЙ РЕЖИМ
```

### Что происходит:
- ✅ Модалка показывает "**ADD FOR FREE**"
- ✅ Текст: "Free trial period - no payment required"
- ✅ Листинги создаются мгновенно без оплаты
- ✅ Статус: `payment_status='free_trial'`
- ✅ Листинги сразу активны (`is_active=true`)
- ❌ Stripe НЕ вызывается

---

## 💳 ПЛАТНЫЙ РЕЖИМ (Paid with Stripe)

### Изменить строку 7:
```typescript
const IS_FREE_TRIAL = false; // ← ПЛАТНЫЙ РЕЖИМ
```

### Что происходит:
- ✅ Модалка показывает "**PROCEED TO PAYMENT**"
- ✅ Цена: $5.00 (одноразовый платёж)
- ✅ Листинг создаётся как **pending** (`is_active=false`)
- ✅ Редирект на Stripe Checkout
- ✅ После оплаты листинг активируется
- ✅ Статус: `payment_status='paid'`

---

## 🚀 Как применить изменения:

### Вариант 1: Локально (для тестирования)
```powershell
# 1. Изменить IS_FREE_TRIAL в PaymentConfirmModal.tsx
# 2. Перезапустить dev сервер
npm run dev
```

### Вариант 2: На production (Vercel)
```powershell
# 1. Изменить IS_FREE_TRIAL в PaymentConfirmModal.tsx
git add src/components/individual/PaymentConfirmModal.tsx
git commit -m "Toggle: Enable/Disable free trial mode"
git push origin main

# 2. Vercel автоматически задеплоит (1-2 минуты)
```

---

## 📋 Quick Reference

### Включить бесплатный период:
```typescript
const IS_FREE_TRIAL = true;
```

### Выключить бесплатный период (включить платежи):
```typescript
const IS_FREE_TRIAL = false;
```

---

## 🎯 Когда использовать FREE TRIAL:

- 🧪 Тестирование функционала без реальных платежей
- 🚀 Запуск сайта (первые дни/недели)
- 🎁 Акции и промо-периоды
- 🐛 Отладка проблем с созданием листингов

---

## 💰 Когда использовать PAID:

- 💼 Нормальная работа сайта
- 💵 Генерация дохода ($5 за листинг)
- 📈 После окончания промо-периода
- ✅ Когда Stripe настроен и протестирован

---

## ⚠️ ВАЖНО:

1. **НЕ забыть вернуть в платный режим** после тестирования!
2. **Проверить Stripe ключи** перед включением платного режима
3. **Сообщить пользователям** о смене режима
4. **Pending листинги** из бесплатного периода останутся pending

---

## 🔍 Как проверить текущий режим:

### Способ 1: Посмотреть в коде
Открыть `src/components/individual/PaymentConfirmModal.tsx` → строка 7

### Способ 2: Попробовать создать листинг
- **FREE**: Кнопка "Add For Free"
- **PAID**: Кнопка "Proceed to Payment ($5)"

---

## 📝 Примечания:

- Изменение применяется **ко всем новым листингам**
- Существующие листинги **не меняются**
- Можно менять сколько угодно раз
- Не требует изменений в базе данных
- Не требует изменений в Vercel env vars

---

**Время переключения: 30 секунд** (локально) или **2 минуты** (на production с деплоем)
