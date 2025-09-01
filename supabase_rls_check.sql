-- Проверка и исправление RLS политик для таблицы listings
-- Возможно анонимные пользователи не могут читать объявления

-- Проверим текущие политики для listings
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE 'No USING clause' 
  END as using_clause
FROM pg_policies 
WHERE tablename = 'listings'
ORDER BY policyname;

-- Проверим статус RLS
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS ENABLED ✅'
    ELSE 'RLS DISABLED ❌'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'listings' 
  AND schemaname = 'public';

-- Если нет политики для чтения - добавим её
-- Анонимные пользователи должны видеть активные объявления
DROP POLICY IF EXISTS "Allow public read access to active listings" ON public.listings;
CREATE POLICY "Allow public read access to active listings" ON public.listings
  FOR SELECT USING (is_active = true);
