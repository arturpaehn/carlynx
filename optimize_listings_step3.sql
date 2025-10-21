-- =================================================================
-- ОПТИМИЗАЦИЯ ПО ОДНОЙ ПОЛИТИКЕ - ШАГ 3
-- =================================================================

-- 3. LISTINGS
SELECT '=== LISTINGS POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'listings' 
AND policyname = 'Users can manage their own listings';

ALTER POLICY "Users can manage their own listings" ON public.listings 
USING (((select auth.uid()) = user_id));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'listings' 
AND policyname = 'Users can manage their own listings';

-- 4. LISTING_IMAGES
SELECT '=== LISTING_IMAGES POLICY ===' as step;

SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'listing_images' 
AND policyname = 'Users can manage their own listing_images';

ALTER POLICY "Users can manage their own listing_images" ON public.listing_images 
USING (((select auth.uid()) = user_id));

SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'listing_images' 
AND policyname = 'Users can manage their own listing_images';