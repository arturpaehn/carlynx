-- =================================================================
-- БЕЗОПАСНАЯ ПРОВЕРКА ПЕРЕД ОПТИМИЗАЦИЕЙ
-- =================================================================

-- 1. Показать точные политики которые будем менять
SELECT 
    'ПОЛИТИКИ ДЛЯ ИЗМЕНЕНИЯ' as info,
    tablename,
    policyname,
    cmd,
    qual as current_condition
FROM pg_policies 
WHERE (tablename = 'dealers' AND policyname IN ('Dealers can update own data', 'Dealers can view own data'))
   OR (tablename = 'listings' AND policyname = 'Users can manage their own listings')
   OR (tablename = 'listing_images' AND policyname = 'Users can manage their own listing_images');

-- 2. Проверить есть ли дубликаты индексов в dealers
SELECT 
    'ИНДЕКСЫ DEALERS' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'dealers'
ORDER BY indexname;

-- 3. Показать все политики для каждой таблицы (количество)
SELECT 
    'КОЛИЧЕСТВО ПОЛИТИК' as info,
    tablename,
    count(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'dealers', 'listings', 'listing_images')
GROUP BY tablename
ORDER BY tablename;