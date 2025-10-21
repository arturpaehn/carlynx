-- =================================================================
-- ФИНАЛЬНАЯ ОПТИМИЗАЦИЯ - ПОСЛЕДНИЕ 3 ПОЛИТИКИ
-- =================================================================

-- 8. DEALER_SUBSCRIPTIONS (сложная политика с подзапросом)
SELECT '=== DEALER_SUBSCRIPTIONS POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'dealer_subscriptions' 
AND policyname = 'Dealers can view own subscriptions';

ALTER POLICY "Dealers can view own subscriptions" ON public.dealer_subscriptions 
USING ((dealer_id IN ( SELECT dealers.dealer_id FROM dealers WHERE (dealers.user_id = (select auth.uid())))));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'dealer_subscriptions' 
AND policyname = 'Dealers can view own subscriptions';

-- 9. STORAGE OBJECTS - access policy
SELECT '=== STORAGE ACCESS POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname = 'Allow access to listing-images bucket';

ALTER POLICY "Allow access to listing-images bucket" ON storage.objects 
USING ((((select auth.uid()) IS NOT NULL) AND (bucket_id = 'listing-images'::text)));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname = 'Allow access to listing-images bucket';

-- 10. STORAGE OBJECTS - delete policy
SELECT '=== STORAGE DELETE POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname = 'Allow deleting from listing-images bucket';

ALTER POLICY "Allow deleting from listing-images bucket" ON storage.objects 
USING ((((select auth.uid()) IS NOT NULL) AND (bucket_id = 'listing-images'::text)));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname = 'Allow deleting from listing-images bucket';