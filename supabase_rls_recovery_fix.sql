-- ПОЛНОЕ ВОССТАНОВЛЕНИЕ RLS для listings
-- Удаляем все политики и создаем заново

-- Удаляем все существующие политики
DROP POLICY IF EXISTS "Allow public read access to active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can view their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
DROP POLICY IF EXISTS "Admin can manage all listings" ON public.listings;

-- Создаем политики заново
-- 1. ВСЕ могут читать активные объявления (включая анонимов)
CREATE POLICY "Allow public read access to active listings" ON public.listings
  FOR SELECT USING (is_active = true);

-- 2. Пользователи могут управлять своими объявлениями
CREATE POLICY "Users can manage their own listings" ON public.listings
  FOR ALL USING (auth.uid() = user_id);

-- 3. Админ может все
CREATE POLICY "Admin can manage all listings" ON public.listings
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@carlynx.us');

-- Проверяем результат
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual from 1 for 50) || '...'
    ELSE 'No USING clause' 
  END as using_clause
FROM pg_policies 
WHERE tablename = 'listings'
ORDER BY policyname;
