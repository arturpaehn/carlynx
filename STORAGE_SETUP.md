# 🖼️ Supabase Storage Setup для Production

## 1️⃣ Создать Storage Bucket (если не создан)

### Через Supabase Dashboard:
1. Открыть https://supabase.com/dashboard/project/kjntriyhqpfxqciaxbpj
2. Storage → Buckets
3. Если **НЕТ** bucket `listing-images`:
   - Click **"New bucket"**
   - Name: `listing-images`
   - Public bucket: ✅ **YES** (чтобы изображения были доступны публично)
   - Click **"Create bucket"**

---

## 2️⃣ Настроить Storage Policies (RLS)

### Открыть Policies для bucket:
Storage → listing-images → Policies

### Добавить 3 политики:

#### Policy 1: **Upload images (INSERT)** - Только авторизованные пользователи
```sql
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');
```

**Через UI:**
- Policy name: `Authenticated users can upload listing images`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: `bucket_id = 'listing-images'`

---

#### Policy 2: **Read images (SELECT)** - Все могут смотреть
```sql
CREATE POLICY "Anyone can view listing images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');
```

**Через UI:**
- Policy name: `Anyone can view listing images`
- Allowed operation: `SELECT`
- Target roles: `public` (или `anon`)
- USING expression: `bucket_id = 'listing-images'`

---

#### Policy 3: **Delete images (DELETE)** - Только владелец объявления
```sql
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM listings WHERE user_id = auth.uid()
  )
);
```

**Через UI:**
- Policy name: `Users can delete their own listing images`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
```sql
bucket_id = 'listing-images' 
AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM listings WHERE user_id = auth.uid()
)
```

**Объяснение:** Проверяет что первая часть пути (listingId) принадлежит текущему пользователю.

---

## 3️⃣ Проверить Storage размеры и лимиты

### Dashboard → Project Settings → Storage:
- **File size limit**: Рекомендую **5-10 MB** на файл (для фото машин достаточно)
- **Maximum file uploads**: Unlimited (или хотя бы 1000)

### Если нужно изменить лимит:
```sql
-- В SQL Editor:
UPDATE storage.buckets
SET file_size_limit = 10485760  -- 10 MB in bytes
WHERE id = 'listing-images';
```

---

## 4️⃣ Настроить CORS (если нужен доступ с других доменов)

### Обычно НЕ нужно для Vercel → Supabase
Supabase автоматически разрешает запросы с домена Next.js проекта.

### Если возникнут CORS ошибки:
Dashboard → API Settings → CORS Allowed Origins
- Добавить: `https://carlynx.vercel.app`
- Добавить: `https://www.carlynx.us` (если используете кастомный домен)

---

## 5️⃣ Проверка что всё работает

### Тест 1: Upload через код
```typescript
// В консоли браузера на carlynx.vercel.app после логина:
const { data, error } = await supabase.storage
  .from('listing-images')
  .upload('test/test.txt', new Blob(['Hello']), {
    contentType: 'text/plain'
  });

console.log(data, error);
// Должен вернуть { path: 'test/test.txt' }
```

### Тест 2: Получить публичный URL
```typescript
const { data } = supabase.storage
  .from('listing-images')
  .getPublicUrl('test/test.txt');

console.log(data.publicUrl);
// Должен быть формата:
// https://kjntriyhqpfxqciaxbpj.supabase.co/storage/v1/object/public/listing-images/test/test.txt
```

### Тест 3: Открыть URL в браузере
- Скопировать publicUrl
- Открыть в новой вкладке
- Должен показать содержимое (или скачать файл)

### Тест 4: Полный flow (добавить объявление с фото)
1. Открыть https://carlynx.vercel.app/add-listing
2. Заполнить форму
3. Загрузить 2-3 фото
4. Submit
5. Оплатить через Stripe
6. Проверить что фото отображаются на странице объявления

---

## 6️⃣ Мониторинг Storage

### Проверить использованное место:
Dashboard → Storage → listing-images
- Показывает: количество файлов, общий размер

### Посмотреть последние загрузки:
Storage → listing-images → Files
- Можно просматривать/удалять файлы вручную

### Логи ошибок:
Dashboard → Logs → Storage Logs
- Показывает все upload/delete операции
- Полезно для дебага ошибок доступа

---

## 🔒 Security Best Practices

✅ **Public bucket** - правильно, нужен для показа фото всем
✅ **Upload only authenticated** - защита от спама
✅ **Delete only owner** - защита от удаления чужих фото
✅ **File size limit 10MB** - защита от злоупотреблений
✅ **Path structure `listingId/filename`** - изоляция фото по объявлениям

---

## 🐛 Troubleshooting

**Ошибка: "new row violates row-level security policy"**
→ Проверить что Policy для INSERT создана с target role `authenticated`

**Ошибка: "Bucket not found"**
→ Создать bucket `listing-images` через Dashboard

**Ошибка: "File size exceeds the limit"**
→ Увеличить `file_size_limit` в настройках bucket

**Фото не отображаются на фронтенде**
→ Проверить что bucket `public` (галочка при создании)
→ Проверить что Policy для SELECT создана с target role `public`

**403 Forbidden при загрузке**
→ Проверить что пользователь авторизован (`auth.uid()` не null)
→ Проверить что Policy для INSERT существует

---

## 📋 Quick Checklist

- [ ] Bucket `listing-images` создан
- [ ] Bucket помечен как **Public**
- [ ] Policy для INSERT (authenticated)
- [ ] Policy для SELECT (public)
- [ ] Policy для DELETE (owner only)
- [ ] File size limit: 10 MB
- [ ] Тест: upload через консоль
- [ ] Тест: getPublicUrl работает
- [ ] Тест: URL открывается в браузере
- [ ] Тест: добавить объявление с фото на проде

---

## 🚀 После настройки

Supabase Storage готов к production! Код в `add-listing/page.tsx` и `edit-listing/[id]/page.tsx` будет работать автоматически.

**Структура файлов:**
```
listing-images/
  ├── <listing-uuid-1>/
  │   ├── 1704067200000_car1.jpg
  │   ├── 1704067201000_car2.jpg
  │   └── 1704067202000_car3.jpg
  ├── <listing-uuid-2>/
  │   ├── 1704067300000_bike1.jpg
  │   └── 1704067301000_bike2.jpg
  └── ...
```

Каждое объявление имеет свою папку (по UUID), внутри - фото с timestamp.
