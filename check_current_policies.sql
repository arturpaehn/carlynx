-- =================================================================
-- ПРОВЕРКА ТЕКУЩИХ RLS ПОЛИТИК
-- =================================================================

-- 1. Проверить все политики для user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 2. Проверить все политики для dealers
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'dealers'
ORDER BY policyname;

-- 3. Проверить все политики для listings
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'listings'
ORDER BY policyname;

-- 4. Показать все индексы для dealers таблицы
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'dealers'
ORDER BY indexname;

-- 5. Показать все индексы для user_profiles таблицы
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles'
ORDER BY indexname;