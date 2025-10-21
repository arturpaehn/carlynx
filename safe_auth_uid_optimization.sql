-- =================================================================
-- БЕЗОПАСНАЯ ОПТИМИЗАЦИЯ AUTH.UID() В ПОЛИТИКАХ
-- =================================================================

-- ВНИМАНИЕ: Этот скрипт изменяет только auth.uid() на (select auth.uid())
-- для улучшения производительности RLS политик. Логика остается точно такой же.

-- 1. ОПТИМИЗАЦИЯ DEALERS ПОЛИТИК
-- =================================================================

-- Dealers can update own data: (user_id = auth.uid()) -> (user_id = (select auth.uid()))
ALTER POLICY "Dealers can update own data" ON public.dealers 
USING ((user_id = (select auth.uid())));

-- Dealers can view own data: (user_id = auth.uid()) -> (user_id = (select auth.uid()))
ALTER POLICY "Dealers can view own data" ON public.dealers 
USING ((user_id = (select auth.uid())));

-- 2. ОПТИМИЗАЦИЯ LISTINGS ПОЛИТИК
-- =================================================================

-- Users can manage their own listings: (auth.uid() = user_id) -> ((select auth.uid()) = user_id)
ALTER POLICY "Users can manage their own listings" ON public.listings 
USING (((select auth.uid()) = user_id));

-- 3. ОПТИМИЗАЦИЯ LISTING_IMAGES ПОЛИТИК
-- =================================================================

-- Users can manage their own listing_images: (auth.uid() = user_id) -> ((select auth.uid()) = user_id)
ALTER POLICY "Users can manage their own listing_images" ON public.listing_images 
USING (((select auth.uid()) = user_id));

-- 4. ОБНОВИТЬ СТАТИСТИКУ ДЛЯ ПЛАНИРОВЩИКА ЗАПРОСОВ
-- =================================================================
ANALYZE public.dealers;
ANALYZE public.listings;
ANALYZE public.listing_images;
ANALYZE public.user_profiles;

-- =================================================================
-- ОПТИМИЗАЦИЯ ЗАВЕРШЕНА
-- Изменения:
-- ✅ 4 политики оптимизированы для лучшей производительности RLS
-- ✅ Никакая логика доступа не изменена
-- ✅ Все функции остались работать точно так же
-- =================================================================

-- ПРОВЕРКА РЕЗУЛЬТАТА (выполните после оптимизации):
SELECT 
    'ПОСЛЕ ОПТИМИЗАЦИИ' as status,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '❌ НЕ ОПТИМИЗИРОВАНО'
        WHEN qual LIKE '%(select auth.uid())%' THEN '✅ ОПТИМИЗИРОВАНО'
        ELSE '➖ БЕЗ AUTH.UID'
    END as optimization_status
FROM pg_policies 
WHERE tablename IN ('dealers', 'listings', 'listing_images')
AND qual IS NOT NULL
ORDER BY tablename, policyname;