-- RLS политики для таблицы motorcycle_brands
-- Выполните в Supabase Dashboard → SQL Editor

-- Аналогично car_brands, motorcycle_brands - это справочная таблица
-- которая должна быть доступна всем для чтения, но защищена от изменений

-- 1. Включить RLS для таблицы motorcycle_brands
ALTER TABLE public.motorcycle_brands ENABLE ROW LEVEL SECURITY;

-- 2. Удалить существующие политики (если есть)
DROP POLICY IF EXISTS "Allow public read access to motorcycle brands" ON public.motorcycle_brands;
DROP POLICY IF EXISTS "Admin can manage motorcycle brands" ON public.motorcycle_brands;

-- 3. Политика чтения - все пользователи (включая анонимных) могут читать бренды
-- Это нужно для автокомплита в формах поиска и добавления объявлений
CREATE POLICY "Allow public read access to motorcycle brands" ON public.motorcycle_brands
  FOR SELECT USING (true);

-- 4. Админская политика - только admin@carlynx.us может изменять бренды
-- Это защищает от случайного или злонамеренного изменения справочников
CREATE POLICY "Admin can manage motorcycle brands" ON public.motorcycle_brands
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'admin@carlynx.us'
  );

-- 5. ВАЖНО: Проверим, что car_brands имеет аналогичные политики
-- Если нет - добавим их для консистентности

-- Включить RLS для car_brands (если еще не включен)
ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;

-- Удалить существующие политики car_brands (если есть)
DROP POLICY IF EXISTS "Allow public read access to car brands" ON public.car_brands;
DROP POLICY IF EXISTS "Admin can manage car brands" ON public.car_brands;

-- Политики для car_brands (аналогично motorcycle_brands)
CREATE POLICY "Allow public read access to car brands" ON public.car_brands
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage car brands" ON public.car_brands
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'admin@carlynx.us'
  );

-- 6. Аналогично для других справочных таблиц
-- Включить RLS для states
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to states" ON public.states;
DROP POLICY IF EXISTS "Admin can manage states" ON public.states;

CREATE POLICY "Allow public read access to states" ON public.states
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage states" ON public.states
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'admin@carlynx.us'
  );

-- Включить RLS для cities
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to cities" ON public.cities;
DROP POLICY IF EXISTS "Admin can manage cities" ON public.cities;

CREATE POLICY "Allow public read access to cities" ON public.cities
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage cities" ON public.cities
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'admin@carlynx.us'
  );

-- 7. Проверить все созданные политики
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE 'No USING clause' 
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE 'No WITH CHECK clause' 
  END as with_check_clause
FROM pg_policies 
WHERE tablename IN ('motorcycle_brands', 'car_brands', 'states', 'cities')
ORDER BY tablename, policyname;

-- 8. Проверить статус RLS для всех справочных таблиц
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS ENABLED ✅'
    ELSE 'RLS DISABLED ❌'
  END as rls_status
FROM pg_tables 
WHERE tablename IN ('motorcycle_brands', 'car_brands', 'states', 'cities', 'listings', 'user_profiles') 
  AND schemaname = 'public'
ORDER BY tablename;

-- Готово! Все справочные таблицы защищены одинаково:
-- ✅ Публичное чтение для всех пользователей
-- ✅ Изменения только для админа
-- ✅ Защита от случайных изменений
-- ✅ Поддержка анонимных пользователей в поиске
