# Первое объявление бесплатно - Логика реализации

## Проблема
Ранее все объявления частников требовали платеж ($2.50 за 14 дней) с первого объявления. 

## Решение
Реализована логика: **Первое объявление ВСЕГДА бесплатно**, дополнительные объявления платные ($2.50).

---

## Архитектура решения

### 1. Проверка активных объявлений
**Файл:** `src/app/add-listing/page.tsx`

```typescript
// Функция для проверки количества активных объявлений
const getActiveListingsCount = async (): Promise<number> => {
  if (!userProfile || !('user_id' in userProfile) || !userProfile.user_id) {
    throw new Error('User not authenticated');
  }

  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userProfile.user_id)
    .eq('is_active', true);  // ← Считаем ТОЛЬКО активные объявления

  if (error) {
    console.error('Error counting active listings:', error);
    throw error;
  }

  return count || 0;
};
```

**Важно:** Считаются ТОЛЬКО `is_active = true` объявления. Деактивированные объявления НЕ учитываются, поэтому пользователь может добавить одно бесплатное объявление, даже если у него есть деактивированные.

### 2. Обновлён обработчик согласия

```typescript
const handleAgreementAccept = async () => {
  setShowAgreement(false);
  
  // Проверяем количество активных объявлений
  try {
    const activeCount = await getActiveListingsCount();
    console.log('Active listings count:', activeCount);
    setActiveListingsCount(activeCount); // Сохраняем для передачи в modal
    
    // Показываем payment modal (внутри он решит нужен ли платеж)
    setShowPaymentModal(true);
  } catch (error) {
    console.error('Error checking active listings:', error);
    setMessage('Error checking your listings. Please try again.');
  }
};
```

### 3. Логика платежей в PaymentConfirmModal

**Файл:** `src/components/individual/PaymentConfirmModal.tsx`

```typescript
interface PaymentConfirmModalProps {
  // ...
  activeListingsCount: number; // ← Число активных объявлений (0 = первое объявление)
}

const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  // ...
  activeListingsCount = 0,
}) => {
  // Определяем, является ли это первым объявлением
  const isFreeFirstListing = activeListingsCount === 0;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (isFreeFirstListing) {
        // Первое объявление: создаём прямо (без Stripe)
        await onConfirm();
        onClose();
      } else {
        // Второе и далее: требуем платёж через Stripe
        if (!onCreatePendingListing) {
          throw new Error('onCreatePendingListing is required for paid flow');
        }
        
        const listingId = await onCreatePendingListing();
        
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingTitle: listingDetails.title,
            amount: LISTING_PRICE * 100, // 250 = $2.50
            userId: userId,
            userEmail: userEmail,
            listingId: listingId,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        window.location.href = data.url; // Редирект на Stripe
      }
    } catch (error) {
      console.error('Error confirming listing:', error);
      alert(t('errorCreatingListing'));
      setIsProcessing(false);
    }
  };
};
```

### 4. Обновлена функция создания объявления

**Файл:** `src/app/add-listing/page.tsx`

```typescript
const realAddListing = async (isFree: boolean = true) => {
  // ...
  
  // Создаём payment запись с правильным статусом
  const paymentStatus = isFree ? 'free_first_listing' : 'paid_listing';
  
  const { data: paymentData, error: paymentError } = await supabase
    .from('individual_payments')
    .insert([
      {
        user_id: userProfile.user_id,
        amount: isFree ? 0.00 : 2.50,  // ← 0 для первого, 2.50 для остальных
        currency: 'USD',
        payment_status: paymentStatus,  // ← 'free_first_listing' или 'paid_listing'
        payment_method: isFree ? 'free' : 'stripe',
        metadata: {
          listing_title: title,
          payment_type: isFree ? 'First listing - FREE' : 'Paid listing - $2.50',
        },
      },
    ])
    .select('payment_id')
    .single();
  
  // ...
};

// Вызывается при подтверждении в modal (первое объявление)
const handleConfirmListing = async () => {
  setShowPaymentModal(false);
  try {
    await realAddListing(true); // true = это первое объявление, бесплатное
  } catch (error) {
    console.error('Error in handleConfirmListing:', error);
    setMessage(error instanceof Error ? error.message : 'Failed to create listing. Please try again.');
  }
};
```

---

## UI/UX изменения

### Локали обновлены

**Английский (`public/locales/en/common.json`):**
```json
"limitedTimeOffer": "🎉 Your First Listing - FREE!",
"freeTrialDescription": "Your first listing is completely FREE! Additional listings will be $2.50 each for 14 days.",
"addForFree": "✓ Add My First Listing FREE",
"proceedToPayment": "Proceed to Payment ($2.50)",
"feature30DaysFree": "✓ 30 days active listing - FREE for your first listing"
```

**Испанский (`public/locales/es/common.json`):**
```json
"limitedTimeOffer": "🎉 Tu Primer Anuncio - ¡GRATIS!",
"freeTrialDescription": "¡Tu primer anuncio es completamente GRATIS! Los anuncios adicionales serán $2.50 cada uno por 14 días.",
"addForFree": "✓ Agregar Mi Primer Anuncio GRATIS",
"proceedToPayment": "Proceder al Pago ($2.50)"
```

### Визуальные изменения в модальном окне

- **Первое объявление:** Зелёный баннер "Your First Listing - FREE!"
- **Остальные:** Синий баннер с ценой "$2.50"
- **Текст кнопки:** 
  - Первое: "✓ Add My First Listing FREE" (зелёная)
  - Остальные: "Proceed to Payment ($2.50)" (синяя)

---

## Поток пользователя

### Сценарий 1: Первое объявление (новый пользователь)
1. Пользователь заполняет форму объявления
2. Нажимает "Add Listing"
3. Видит соглашение → принимает
4. `handleAgreementAccept()` → считает активные объявления (0)
5. Открывается PaymentConfirmModal с `activeListingsCount = 0`
6. `isFreeFirstListing = true` → показывается зелёный баннер "FREE"
7. Нажимает "✓ Add My First Listing FREE"
8. `realAddListing(true)` → создание записи с `payment_status: 'free_first_listing'`
9. Объявление создаётся, `is_active = true`, пользователь видит на странице My Listings

### Сценарий 2: Второе и далее объявления
1. Пользователь заполняет форму объявления
2. Нажимает "Add Listing"
3. Видит соглашение → принимает
4. `handleAgreementAccept()` → считает активные объявления (≥1)
5. Открывается PaymentConfirmModal с `activeListingsCount ≥ 1`
6. `isFreeFirstListing = false` → показывается синий баннер "$2.50"
7. Нажимает "Proceed to Payment ($2.50)"
8. `createPendingListing()` → создание с `is_active = false, payment_status = 'pending'`
9. Редирект на Stripe для оплаты
10. После успешной оплаты → объявление активируется на payment-success странице

### Сценарий 3: Есть деактивированные объявления
- Пользователь может добавить **1 бесплатное объявление**, даже если у него есть деактивированные
- `getActiveListingsCount()` считает только `is_active = true`
- Если деактивированное объявление позже активируется → это уже второе активное, поэтому следующее будет платным

---

## Database записи

### individual_payments таблица

Теперь содержит разные типы платежей:

```sql
payment_status = 'free_first_listing'
  amount = 0.00
  payment_method = 'free'
  metadata = { payment_type: 'First listing - FREE' }

payment_status = 'paid_listing'
  amount = 2.50
  payment_method = 'stripe'
  metadata = { payment_type: 'Paid listing - $2.50' }
```

---

## Важные моменты

✅ **Правильно:**
- Первое объявление всегда бесплатно
- Деактивированные объявления НЕ считаются
- Платёж требуется только для 2-го и последующих объявлений

⚠️ **Граничные случаи:**
- Если пользователь имеет 1 активное объявление, второе требует платёж
- Если пользователь деактивирует объявление и создаёт новое → новое платное
- Если пользователь активирует старое деактивированное → старое объявление остаётся активным, новые требуют платёж

---

## Тестирование

### Тест 1: Первое объявление
1. Новый пользователь
2. Добавить объявление
3. Ожидаемый результат: без платежа, прямое создание

### Тест 2: Второе объявление
1. Пользователь с 1 активным объявлением
2. Добавить объявление
3. Ожидаемый результат: требуется платёж $2.50

### Тест 3: После деактивации
1. Пользователь деактивирует первое объявление
2. Добавить новое
3. Ожидаемый результат: первое всё ещё бесплатно (логика: activeCount = 0)

---

## Совместимость

- ✅ Не требует миграции БД
- ✅ Совместимо со старыми объявлениями
- ✅ Работает как для новых, так и для существующих пользователей
- ✅ Поддерживает реактивацию через `/my-listings` страницу
