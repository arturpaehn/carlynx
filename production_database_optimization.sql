-- =================================================================
-- УНИВЕРСАЛЬНЫЙ СКРИПТ ОПТИМИЗАЦИИ ПРОИЗВОДСТВЕННОЙ БАЗЫ
-- Исправляет AUTH RLS политики для улучшения производительности
-- =================================================================

-- ВАЖНО: Этот скрипт безопасен и не изменяет логику доступа!
-- Он только заменяет auth.uid() на (select auth.uid()) для кэширования

-- =================================================================
-- 1. ОПТИМИЗАЦИЯ INDIVIDUAL_PAYMENTS
-- =================================================================
ALTER POLICY "Users can view their own payments" ON public.individual_payments 
USING (((select auth.uid()) = user_id));

-- =================================================================
-- 2. ОПТИМИЗАЦИЯ DEALERS
-- =================================================================
ALTER POLICY "Dealers can update own data" ON public.dealers 
USING ((user_id = (select auth.uid())));

ALTER POLICY "Dealers can view own data" ON public.dealers 
USING ((user_id = (select auth.uid())));

-- =================================================================
-- 3. ОПТИМИЗАЦИЯ LISTINGS
-- =================================================================
ALTER POLICY "Users can manage their own listings" ON public.listings 
USING (((select auth.uid()) = user_id));

-- =================================================================
-- 4. ОПТИМИЗАЦИЯ LISTING_IMAGES
-- =================================================================
ALTER POLICY "Users can manage their own listing_images" ON public.listing_images 
USING (((select auth.uid()) = user_id));

-- =================================================================
-- 5. ОПТИМИЗАЦИЯ USER_PROFILES
-- =================================================================
ALTER POLICY "Users can delete own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

-- =================================================================
-- 6. ОПТИМИЗАЦИЯ DEALER_SUBSCRIPTIONS
-- =================================================================
ALTER POLICY "Dealers can view own subscriptions" ON public.dealer_subscriptions 
USING ((dealer_id IN ( SELECT dealers.dealer_id FROM dealers WHERE (dealers.user_id = (select auth.uid())))));

-- =================================================================
-- 7. ОПТИМИЗАЦИЯ STORAGE OBJECTS
-- =================================================================
ALTER POLICY "Allow access to listing-images bucket" ON storage.objects 
USING ((((select auth.uid()) IS NOT NULL) AND (bucket_id = 'listing-images'::text)));

ALTER POLICY "Allow deleting from listing-images bucket" ON storage.objects 
USING ((((select auth.uid()) IS NOT NULL) AND (bucket_id = 'listing-images'::text)));

-- =================================================================
-- 8. ОБНОВЛЕНИЕ СТАТИСТИКИ ТАБЛИЦ
-- =================================================================
ANALYZE public.dealers;
ANALYZE public.listings;
ANALYZE public.listing_images;
ANALYZE public.user_profiles;
ANALYZE public.individual_payments;
ANALYZE public.dealer_subscriptions;

-- =================================================================
-- 9. ПРОВЕРКА РЕЗУЛЬТАТОВ ОПТИМИЗАЦИИ
-- =================================================================
SELECT 
    '🎯 РЕЗУЛЬТАТ ОПТИМИЗАЦИИ' as status,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' AND qual NOT LIKE '%SELECT auth.uid()%' THEN '❌ НЕ ОПТИМИЗИРОВАНО'
        WHEN qual LIKE '%(select auth.uid())%' OR qual LIKE '%SELECT auth.uid()%' THEN '✅ ОПТИМИЗИРОВАНО'
        ELSE '➖ БЕЗ AUTH.UID'
    END as optimization_status
FROM pg_policies 
WHERE qual LIKE '%auth.uid()%'
ORDER BY 
    CASE WHEN qual LIKE '%(select auth.uid())%' OR qual LIKE '%SELECT auth.uid()%' THEN 1 ELSE 2 END,
    tablename, 
    policyname;

-- Финальная статистика
SELECT 
    '📊 СТАТИСТИКА' as info,
    count(*) as total_auth_policies,
    count(*) FILTER (WHERE qual LIKE '%(select auth.uid())%' OR qual LIKE '%SELECT auth.uid()%') as optimized,
    count(*) FILTER (WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' AND qual NOT LIKE '%SELECT auth.uid()%') as need_optimization
FROM pg_policies 
WHERE qual LIKE '%auth.uid()%';

-- =================================================================
-- ОПТИМИЗАЦИЯ ЗАВЕРШЕНА!
-- 
-- Что было сделано:
-- ✅ Оптимизировано 11 RLS политик
-- ✅ Заменено auth.uid() на (select auth.uid()) для кэширования  
-- ✅ Обновлена статистика таблиц для планировщика запросов
-- ✅ Сохранена вся функциональность и безопасность
--
-- Ожидаемый результат:
-- ⚡ Устранение предупреждений auth_rls_initplan
-- ⚡ Значительное улучшение производительности RLS
-- ⚡ Более быстрые запросы к базе данных
-- =================================================================