-- =================================================================
-- ПРОВЕРКА РЕЗУЛЬТАТОВ ОПТИМИЗАЦИИ
-- =================================================================

-- 1. Проверим статус оптимизации политик
SELECT 
    'СТАТУС ОПТИМИЗАЦИИ' as check_type,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' THEN '❌ НЕ ОПТИМИЗИРОВАНО'
        WHEN qual LIKE '%(select auth.uid())%' THEN '✅ ОПТИМИЗИРОВАНО'
        ELSE '➖ БЕЗ AUTH.UID'
    END as optimization_status,
    qual
FROM pg_policies 
WHERE tablename IN ('dealers', 'listings', 'listing_images')
AND qual IS NOT NULL
ORDER BY tablename, policyname;

-- 2. Проверим активные процессы (есть ли зависшие)
SELECT 
    'АКТИВНЫЕ ПРОЦЕССЫ' as check_type,
    pid,
    state,
    query_start,
    left(query, 100) as query_preview
FROM pg_stat_activity 
WHERE state = 'active'
AND query NOT LIKE '%pg_stat_activity%'
AND query NOT LIKE '%СТАТУС ОПТИМИЗАЦИИ%'
ORDER BY query_start;

-- 3. Общая статистика по политикам
SELECT 
    'ОБЩАЯ СТАТИСТИКА' as check_type,
    tablename,
    count(*) as total_policies,
    count(*) FILTER (WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%') as need_optimization,
    count(*) FILTER (WHERE qual LIKE '%(select auth.uid())%') as already_optimized
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'dealers', 'listings', 'listing_images')
GROUP BY tablename
ORDER BY tablename;