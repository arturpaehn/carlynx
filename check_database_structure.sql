-- ============================================================
-- DATABASE STRUCTURE CHECK
-- ============================================================

-- 1. LIST ALL TABLES
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. CHECK DEALERS TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'dealers'
ORDER BY ordinal_position;

-- 3. CHECK DEALERS TABLE DATA
SELECT * FROM dealers LIMIT 10;

-- 3.5. CHECK DEALER_SUBSCRIPTIONS TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'dealer_subscriptions'
ORDER BY ordinal_position;

-- 3.6. CHECK DEALER_SUBSCRIPTIONS TABLE DATA
SELECT * FROM dealer_subscriptions LIMIT 10;

-- 4. CHECK SUBSCRIPTION_TIERS TABLE
SELECT 
    tier_id,
    tier_name,
    monthly_price,
    listing_limit as max_active_listings,
    active
FROM subscription_tiers
ORDER BY monthly_price;

-- 5. CHECK USER_PROFILES TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5.5. CHECK USER_PROFILES TABLE DATA (all users)
SELECT * FROM user_profiles LIMIT 10;

-- 6. CHECK RLS POLICIES ON DEALERS TABLE
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
WHERE tablename = 'dealers';

-- 7. CHECK IF DEALERS TABLE EXISTS AT ALL
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dealers'
) as dealers_table_exists;

-- 8. CHECK FOREIGN KEY CONSTRAINTS
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('dealers', 'dealer_subscriptions')
  AND tc.constraint_type = 'FOREIGN KEY';
