-- =================================================================
-- ОПТИМИЗАЦИЯ ПО ОДНОЙ ПОЛИТИКЕ - ШАГ 2
-- =================================================================

-- 1. DEALERS - первая политика
SELECT '=== DEALERS UPDATE POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'dealers' 
AND policyname = 'Dealers can update own data';

ALTER POLICY "Dealers can update own data" ON public.dealers 
USING ((user_id = (select auth.uid())));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'dealers' 
AND policyname = 'Dealers can update own data';

-- 2. DEALERS - вторая политика  
SELECT '=== DEALERS VIEW POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'dealers' 
AND policyname = 'Dealers can view own data';

ALTER POLICY "Dealers can view own data" ON public.dealers 
USING ((user_id = (select auth.uid())));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'dealers' 
AND policyname = 'Dealers can view own data';