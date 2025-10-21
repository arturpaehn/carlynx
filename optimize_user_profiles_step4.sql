-- =================================================================
-- ОПТИМИЗАЦИЯ ПО ОДНОЙ ПОЛИТИКЕ - ШАГ 4 (USER_PROFILES)
-- =================================================================

-- 5. USER_PROFILES - delete
SELECT '=== USER_PROFILES DELETE POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND policyname = 'Users can delete own profile';

ALTER POLICY "Users can delete own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND policyname = 'Users can delete own profile';

-- 6. USER_PROFILES - update
SELECT '=== USER_PROFILES UPDATE POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND policyname = 'Users can update own profile';

ALTER POLICY "Users can update own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND policyname = 'Users can update own profile';

-- 7. USER_PROFILES - view
SELECT '=== USER_PROFILES VIEW POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND policyname = 'Users can view own profile';

ALTER POLICY "Users can view own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND policyname = 'Users can view own profile';