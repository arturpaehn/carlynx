# План реализации функционала для дилеров

## ✅ ЗАВЕРШЕНО

1. ✅ SQL миграция с таблицами dealers, dealer_subscriptions, subscription_tiers
2. ✅ Регистрация с выбором типа аккаунта (Individual/Dealer)
3. ✅ API для сохранения user_type при регистрации
4. ✅ 5 тарифов: $400 (100), $800 (250), $1250 (500), $2000 (1000), $3000 (unlimited)
5. ✅ RLS для subscription_tiers и individual_payments

---

## 🎯 ТРЕБОВАНИЯ

### Частники (Individual Users):
- ❌ **НЕТ лимитов** на количество объявлений
- ✅ Оплата $5 за каждое объявление
- ✅ Текущая страница /add-listing
- ✅ Текущая страница /my-listings
- ❌ НЕ могут реактивировать неактивные объявления

### Дилеры (Dealers):
- ✅ Месячная подписка ($400-$3000)
- ✅ Free trial 7 дней
- ✅ Лимиты по тарифу (100, 250, 500, 1000, unlimited)
- ✅ Отдельные страницы /dealer/*
- ✅ Могут реактивировать объявления (если подписка активна)
- ✅ **Массовое добавление**: несколько объявлений в строчку (компактная форма)
- ✅ **Импорт CSV/Excel**: автозаполнение полей без фото
- ✅ Фильтры: по марке, по дате добавления
- ✅ Компактный вид списка объявлений (мельче чем у частников)

---

## 📦 ЭТАП 1: Hooks и Guards (НАЧАТЬ С ЭТОГО)

### 1.1 Создать useUserType hook
**Файл:** `src/hooks/useUserType.ts`
```typescript
export function useUserType() {
  // Получает user_type из user_profiles
  // Возвращает: { userType: 'individual' | 'dealer' | null, loading, error }
}
```

### 1.2 Создать DealerGuard компонент
**Файл:** `src/components/dealer/DealerGuard.tsx`
```typescript
// Если не dealer → редирект на /
```

### 1.3 Создать IndividualGuard компонент
**Файл:** `src/components/individual/IndividualGuard.tsx`
```typescript
// Если не individual → редирект на /
```

### 1.4 Обновить Header
**Файл:** `src/components/Header.tsx`
- Показывать разную навигацию для дилеров и частников
- Частники: Add Listing, My Listings, Profile
- Дилеры: Dashboard, My Listings, Add Listing, Subscription

---

## 📦 ЭТАП 2: Страница выбора подписки

### 2.1 Создать /dealer/subscription
**Файл:** `src/app/dealer/subscription/page.tsx`
- Показать 5 тарифов в красивых карточках
- "Start 7-day free trial" кнопка
- Интеграция Stripe Subscriptions

### 2.2 API для создания подписки
**Файл:** `src/app/api/dealer/create-subscription/route.ts`
- Создать Stripe Subscription
- Создать запись в dealers
- Установить trial_end_date = NOW() + 7 days

### 2.3 Webhook для подписок
**Файл:** `src/app/api/dealer/webhooks/stripe/route.ts`
- Обработка customer.subscription.created
- Обработка customer.subscription.updated
- Обработка customer.subscription.deleted
- Обновление dealers.subscription_status

---

## 📦 ЭТАП 3: Страница добавления объявлений для дилеров

### 3.1 Создать /dealer/add-listing
**Файл:** `src/app/dealer/add-listing/page.tsx`

**КЛЮЧЕВЫЕ ОТЛИЧИЯ ОТ /add-listing:**
1. ❌ Убрать PaymentConfirmModal (нет оплаты $5)
2. ✅ Проверка subscription_status перед submit
3. ✅ Показать баннер: "45 / 100 listings used this month"
4. ✅ **КОМПАКТНАЯ ФОРМА**: поля в строчку, не сверху вниз
5. ✅ **МНОЖЕСТВЕННОЕ ДОБАВЛЕНИЕ**: кнопка "Add another listing row"
6. ✅ Кнопка "Import CSV/Excel"

**Структура компактной формы:**
```
Row 1: [Brand] [Model] [Year] [Price] [Mileage] [City] [State] [Photos] [X Remove]
Row 2: [Brand] [Model] [Year] [Price] [Mileage] [City] [State] [Photos] [X Remove]
...
[+ Add Row] [Import CSV] [Submit All]
```

### 3.2 Компонент для множественного добавления
**Файл:** `src/components/dealer/BulkAddListingForm.tsx`
- Массив состояний для нескольких строк
- Валидация каждой строки
- Submit всех объявлений одним батчем

### 3.3 API для проверки лимита
**Файл:** `src/app/api/dealer/check-listing-limit/route.ts`
```typescript
POST /api/dealer/check-listing-limit
Body: { userId, count: 5 } // хочу добавить 5 объявлений
Response: { canAdd: true, remaining: 55, limit: 100 }
```

### 3.4 Импорт CSV/Excel
**Файл:** `src/components/dealer/ImportListingsModal.tsx`
- Upload CSV/Excel файла
- Парсинг данных
- Заполнение формы (без фото)
- Пользователь добавляет фото вручную

---

## 📦 ЭТАП 4: Страница "Мои объявления" для дилеров

### 4.1 Создать /dealer/my-listings
**Файл:** `src/app/dealer/my-listings/page.tsx`

**КЛЮЧЕВЫЕ ОТЛИЧИЯ ОТ /my-listings:**
1. ✅ **Компактный вид**: мельче карточки, больше объявлений на экран
2. ✅ **Фильтры**:
   - По марке (dropdown)
   - По дате добавления (date picker)
   - По статусу (active/inactive)
3. ✅ **Реактивация**: кнопка "Activate" для неактивных объявлений
4. ✅ Показать subscription status вверху
5. ✅ Массовые действия (выбрать несколько → деактивировать)

**Структура компактного вида:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Photo] Brand Model Year | $15,000 | City, State | [Active] │
│         Fuel • Trans • 50k mi | Added: Jan 5, 2025 | [Edit]  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Компонент компактной карточки
**Файл:** `src/components/dealer/CompactListingCard.tsx`
- Горизонтальный layout
- Меньше высота (100px вместо 300px)
- Checkbox для массового выбора

### 4.3 Фильтры
**Файл:** `src/components/dealer/ListingsFilters.tsx`
- Brand dropdown
- Date range picker
- Status toggle

---

## 📦 ЭТАП 5: Dashboard для дилеров (опционально)

### 5.1 Создать /dealer/dashboard
**Файл:** `src/app/dealer/dashboard/page.tsx`
- Subscription status card
- Listings stats: "45 / 100 used"
- Recent listings
- Quick actions

---

## 🔒 ЗАЩИТА МАРШРУТОВ

### middleware.ts (обновить)
```typescript
// Правила доступа:
- /add-listing → только individual
- /my-listings → только individual
- /dealer/* → только dealer

// Реализация:
1. Получить user_type из user_profiles
2. Если не совпадает → 403 или редирект
```

---

## 📝 API ENDPOINTS (новые)

```
POST /api/dealer/create-subscription
POST /api/dealer/check-listing-limit
POST /api/dealer/check-subscription
POST /api/dealer/reactivate-listing
POST /api/dealer/bulk-deactivate
POST /api/dealer/webhooks/stripe
POST /api/dealer/import-csv
```

---

## 🗄️ ИЗМЕНЕНИЯ В БД (если нужны)

### Добавить trial в dealers
```sql
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;
```

### Функция для проверки trial
```sql
CREATE OR REPLACE FUNCTION is_dealer_trial_active(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM dealers 
    WHERE user_id = p_user_id 
    AND subscription_status = 'trialing'
    AND trial_end_date > NOW()
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 ПОРЯДОК РАЗРАБОТКИ

### ШАГ 1 (критично):
1. useUserType hook
2. DealerGuard, IndividualGuard
3. Обновить Header (навигация)
4. /dealer/subscription (выбор тарифа)
5. Stripe Subscriptions API

### ШАГ 2 (важно):
6. /dealer/add-listing (компактная форма)
7. Множественное добавление (+ Add Row)
8. API check-listing-limit
9. /dealer/my-listings (компактный вид)
10. Реактивация объявлений

### ШАГ 3 (улучшения):
11. Импорт CSV/Excel
12. Массовые действия
13. Фильтры по марке и дате
14. Dashboard

---

## ✅ ЧЕКЛИСТ ПЕРЕД СТАРТОМ

- [ ] RLS миграция применена
- [ ] Проверить что частники могут добавлять без лимитов
- [ ] Создать структуру папок /dealer/*
- [ ] Настроить Stripe Subscriptions в dashboard
- [ ] Добавить STRIPE_SUBSCRIPTION_WEBHOOK_SECRET в .env

---

## 🚀 ГОТОВЫ НАЧИНАТЬ С ЭТАПА 1?

Жду твоего подтверждения чтобы создать первые файлы!
