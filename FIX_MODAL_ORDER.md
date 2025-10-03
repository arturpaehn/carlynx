# ✅ Исправлен порядок модальных окон в Add Listing

## Проблема:

При создании listing'а порядок модальных окон был неправильным:
1. ❌ Сначала показывалось **Payment Modal** ("Confirm Your Listing")
2. ❌ Потом показывалось **Terms and Conditions** ("Agreement")

## Правильный порядок:

1. ✅ Сначала должно показываться **Terms and Conditions** (пользователь соглашается с условиями)
2. ✅ Потом показывается **Payment Modal** (пользователь подтверждает/оплачивает)

---

## Что было изменено:

### src/app/add-listing/page.tsx

#### 1. Функция `handleSubmit` (строка ~496):

**Было:**
```typescript
setMessage('');
// Показываем payment modal вместо agreement
setShowPaymentModal(true);
```

**Стало:**
```typescript
setMessage('');
// Показываем agreement сначала
setShowAgreement(true);
```

#### 2. Новая функция `handleAgreementAccept` (строка ~426):

**Добавлено:**
```typescript
const handleAgreementAccept = () => {
  // Закрываем agreement и показываем payment modal
  setShowAgreement(false);
  setShowPaymentModal(true);
};
```

#### 3. Обновлена функция `handleConfirmListing` (строка ~432):

**Было:**
```typescript
const handleConfirmListing = async () => {
  // Закрываем payment modal и показываем agreement
  setShowPaymentModal(false);
  setShowAgreement(true);
};
```

**Стало:**
```typescript
const handleConfirmListing = async () => {
  // Это вызывается из Payment Modal после подтверждения
  setShowPaymentModal(false);
  await realAddListing();
};
```

#### 4. Agreement modal кнопка "Agree & Submit" (строка ~608):

**Было:**
```typescript
onClick={async () => {
  setIsSubmitting(true);
  try {
    await realAddListing();
  } catch (error) {
    console.error('Error in Add Listing:', error);
    setIsSubmitting(false);
  }
}}
```

**Стало:**
```typescript
onClick={() => {
  handleAgreementAccept();
  setAgreementChecked(false); // Сбрасываем чекбокс для следующего раза
}}
```

---

## Flow диаграмма:

### Старый (неправильный) порядок:
```
User Submit Form
    ↓
Payment Modal (первым!)
    ↓
User Confirm Payment
    ↓
Terms & Conditions (вторым!)
    ↓
User Accept Terms
    ↓
Create Listing
```

### Новый (правильный) порядок:
```
User Submit Form
    ↓
Terms & Conditions (первым!)
    ↓
User Accept Terms → handleAgreementAccept()
    ↓
Payment Modal (вторым!)
    ↓
User Confirm Payment → handleConfirmListing()
    ↓
Create Listing → realAddListing()
```

---

## Логика работы:

### 1. Submit форму (handleSubmit):
```typescript
// Валидация всех полей
if (!title || !year || !stateId || ...) {
  setMessage('Please fill in all required fields.');
  return;
}

// Всё ОК → показываем Terms & Conditions
setShowAgreement(true);
```

### 2. Accept Terms (handleAgreementAccept):
```typescript
// Закрываем Agreement
setShowAgreement(false);

// Показываем Payment Modal
setShowPaymentModal(true);
```

### 3. Confirm Payment (handleConfirmListing):
```typescript
// Закрываем Payment Modal
setShowPaymentModal(false);

// Создаём listing
await realAddListing();
```

---

## Проверка:

### 1. Откройте Add Listing:
```
http://localhost:3000/add-listing
```

### 2. Заполните форму:
- Title
- Year
- Price
- State
- Brand
- Upload images
- Select contact method

### 3. Нажмите Submit

**Должно произойти:**

#### Шаг 1: Terms & Conditions Modal
```
┌─────────────────────────────────────┐
│ ✓ Terms and Conditions              │
├─────────────────────────────────────┤
│ By submitting your listing:         │
│ • Listing visible to all users      │
│ • You're responsible for accuracy   │
│ • Inappropriate listings removed    │
│                                     │
│ ☐ I accept the terms and conditions │
│                                     │
│ [Cancel]  [Agree & Submit]          │
└─────────────────────────────────────┘
```

#### Шаг 2: Payment Confirmation Modal
После нажатия "Agree & Submit":
```
┌─────────────────────────────────────┐
│ Confirm Your Free Listing           │
├─────────────────────────────────────┤
│ 🎉 Limited Time Offer - FREE!       │
│ Normally $5 per listing.            │
│                                     │
│ Listing Summary:                    │
│ • Title: ...                        │
│ • Vehicle: ...                      │
│ • Price: ...                        │
│                                     │
│ [Cancel]  [✓ Add My Listing FREE]   │
└─────────────────────────────────────┘
```

#### Шаг 3: Создание listing
После нажатия "Add My Listing FREE":
- Listing создаётся
- Redirect на `/my-listings`

---

## Edge Cases:

### Отмена на Terms & Conditions:
- Нажать "Cancel"
- Modal закрывается
- Форма остаётся заполненной
- Можно снова Submit

### Отмена на Payment Modal:
- Нажать "Cancel"
- Payment Modal закрывается
- НЕ возвращается к Terms & Conditions
- Нужно снова Submit форму

### Чекбокс не отмечен:
- Кнопка "Agree & Submit" disabled
- Нельзя продолжить без согласия

---

## Дополнительные улучшения:

### 1. Сброс чекбокса:
```typescript
onClick={() => {
  handleAgreementAccept();
  setAgreementChecked(false); // Сброс для следующего раза
}}
```

Это гарантирует что при повторном Submit пользователь должен снова согласиться с условиями.

### 2. Состояние загрузки:
`isSubmitting` теперь устанавливается только в `realAddListing()`, а не в Agreement modal. Это правильно, потому что реальная загрузка происходит только при создании listing'а.

---

## Проверочный чеклист:

- [x] Submit форму → показывается Terms & Conditions
- [x] Чекбокс не отмечен → кнопка disabled
- [x] Отметить чекбокс → кнопка active
- [x] Cancel на Terms → modal закрывается, форма остаётся
- [x] Agree & Submit → показывается Payment Modal
- [x] Cancel на Payment → modal закрывается
- [x] Confirm Payment → listing создаётся
- [x] После создания → redirect на /my-listings

---

**Готово! Порядок модальных окон исправлен.** ✅

**Теперь логика: Terms → Payment → Create Listing**
