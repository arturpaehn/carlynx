-- =================================================================
-- ПОЛНАЯ ПРОВЕРКА БАЗЫ ДАННЫХ - RLS ПОЛИТИКИ И ИНДЕКСЫ
-- =================================================================

-- =====================================================
-- 1. ПРОВЕРКА ВСЕХ RLS ПОЛИТИК
-- =====================================================

-- Политики для user_profiles
SELECT 
    '========== USER_PROFILES POLICIES ==========' as section,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Политики для dealers
SELECT 
    '========== DEALERS POLICIES ==========' as section,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'dealers'
ORDER BY policyname;

-- Политики для listings
SELECT 
    '========== LISTINGS POLICIES ==========' as section,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'listings'
ORDER BY policyname;

-- Политики для listing_images
SELECT 
    '========== LISTING_IMAGES POLICIES ==========' as section,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'listing_images'
ORDER BY policyname;

-- =====================================================
-- 2. ПРОВЕРКА ВСЕХ ИНДЕКСОВ
-- =====================================================

-- Индексы для user_profiles
SELECT 
    '========== USER_PROFILES INDEXES ==========' as section,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles'
ORDER BY indexname;

-- Индексы для dealers
SELECT 
    '========== DEALERS INDEXES ==========' as section,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'dealers'
ORDER BY indexname;

-- Индексы для listings
SELECT 
    '========== LISTINGS INDEXES ==========' as section,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'listings'
ORDER BY indexname;

-- =====================================================
-- 3. ПОИСК ДУБЛИРУЮЩИХСЯ ИНДЕКСОВ
-- =====================================================

-- Показать индексы на одной колонке в dealers
SELECT 
    '========== DUPLICATE INDEXES ANALYSIS ==========' as section,
    'dealers' as table_name,
    string_agg(indexname, ', ') as duplicate_indexes,
    regexp_replace(indexdef, '.*\((.*)\).*', '\1') as column_indexed
FROM pg_indexes 
WHERE tablename = 'dealers'
GROUP BY regexp_replace(indexdef, '.*\((.*)\).*', '\1')
HAVING count(*) > 1;

-- =====================================================
-- 4. СТАТИСТИКА ПО ПОЛИТИКАМ
-- =====================================================

SELECT 
    '========== POLICIES STATISTICS ==========' as section,
    tablename,
    count(*) as total_policies,
    count(*) FILTER (WHERE permissive = 'PERMISSIVE') as permissive_policies,
    count(*) FILTER (WHERE permissive = 'RESTRICTIVE') as restrictive_policies
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'dealers', 'listings', 'listing_images')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 5. ПРОВЕРКА AUTH.UID() В ПОЛИТИКАХ
-- =====================================================

SELECT 
    '========== AUTH.UID() USAGE IN POLICIES ==========' as section,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS_OPTIMIZATION'
        WHEN qual LIKE '%(select auth.uid())%' THEN 'ALREADY_OPTIMIZED'
        ELSE 'NO_AUTH_UID'
    END as auth_uid_status,
    qual
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'dealers', 'listings', 'listing_images')
AND qual IS NOT NULL
ORDER BY tablename, policyname;