-- ИСПРАВЛЕНИЕ: Добавляем политику чтения для анонимных пользователей
-- Это главная причина ошибки "Listing Not Found"

DROP POLICY IF EXISTS "Allow public read access to active listings" ON public.listings;
CREATE POLICY "Allow public read access to active listings" ON public.listings
  FOR SELECT USING (is_active = true);

-- Проверяем что политика создана
SELECT 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'listings'
ORDER BY policyname;
