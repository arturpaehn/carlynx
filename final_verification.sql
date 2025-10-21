-- =================================================================
-- ФИНАЛЬНАЯ ПРОВЕРКА ВСЕХ ОПТИМИЗИРОВАННЫХ ПОЛИТИК
-- =================================================================

-- Показать статус всех политик с auth.uid()
SELECT 
    '🎯 ФИНАЛЬНАЯ ПРОВЕРКА ОПТИМИЗАЦИИ' as status,
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

-- Статистика оптимизации
SELECT 
    '📊 СТАТИСТИКА ОПТИМИЗАЦИИ' as info,
    count(*) as total_auth_policies,
    count(*) FILTER (WHERE qual LIKE '%(select auth.uid())%' OR qual LIKE '%SELECT auth.uid()%') as optimized,
    count(*) FILTER (WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' AND qual NOT LIKE '%SELECT auth.uid()%') as need_optimization
FROM pg_policies 
WHERE qual LIKE '%auth.uid()%';

-- Обновить статистику таблиц для планировщика запросов
ANALYZE public.dealers;
ANALYZE public.listings;
ANALYZE public.listing_images;
ANALYZE public.user_profiles;
ANALYZE public.individual_payments;
ANALYZE public.dealer_subscriptions;

SELECT '🚀 ОПТИМИЗАЦИЯ БАЗЫ ДАННЫХ ЗАВЕРШЕНА!' as final_status;