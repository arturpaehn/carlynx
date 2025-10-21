-- =================================================================
-- ПОШАГОВАЯ ОПТИМИЗАЦИЯ AUTH.UID() - ТОЧНЫЕ ИМЕНА ПОЛИТИК
-- =================================================================

-- ВАЖНО: Выполняйте по одной команде за раз, чтобы избежать блокировок!

-- 1. DEALERS (уже частично оптимизированы, но исправим)
-- =================================================================

-- Dealers can update own data (уже оптимизирована, но с AS uid - исправим)
ALTER POLICY "Dealers can update own data" ON public.dealers 
USING ((user_id = (select auth.uid())));

-- Dealers can view own data (уже оптимизирована, но с AS uid - исправим)  
ALTER POLICY "Dealers can view own data" ON public.dealers 
USING ((user_id = (select auth.uid())));

-- 2. LISTINGS (уже частично оптимизирована, но исправим)
-- =================================================================

-- Users can manage their own listings (уже оптимизирована, но с AS uid - исправим)
ALTER POLICY "Users can manage their own listings" ON public.listings 
USING (((select auth.uid()) = user_id));

-- 3. LISTING_IMAGES (уже частично оптимизирована, но исправим)
-- =================================================================

-- Users can manage their own listing_images (уже оптимизирована, но с AS uid - исправим)
ALTER POLICY "Users can manage their own listing_images" ON public.listing_images 
USING (((select auth.uid()) = user_id));

-- 4. USER_PROFILES (уже частично оптимизированы, но исправим)
-- =================================================================

-- Users can delete own profile (уже оптимизирована, но с AS uid - исправим)
ALTER POLICY "Users can delete own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

-- Users can update own profile (уже оптимизирована, но с AS uid - исправим)
ALTER POLICY "Users can update own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

-- Users can view own profile (уже оптимизирована, но с AS uid - исправим)
ALTER POLICY "Users can view own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id));

-- 5. INDIVIDUAL_PAYMENTS (нужна оптимизация)
-- =================================================================

-- Users can view their own payments
ALTER POLICY "Users can view their own payments" ON public.individual_payments 
USING (((select auth.uid()) = user_id));

-- 6. DEALER_SUBSCRIPTIONS (сложная политика - нужна оптимизация)
-- =================================================================

-- Dealers can view own subscriptions
ALTER POLICY "Dealers can view own subscriptions" ON public.dealer_subscriptions 
USING ((dealer_id IN ( SELECT dealers.dealer_id FROM dealers WHERE (dealers.user_id = (select auth.uid())))));

-- 7. OBJECTS (Storage policies - нужна оптимизация)
-- =================================================================

-- Allow access to listing-images bucket
ALTER POLICY "Allow access to listing-images bucket" ON storage.objects 
USING ((((select auth.uid()) IS NOT NULL) AND (bucket_id = 'listing-images'::text)));

-- Allow deleting from listing-images bucket
ALTER POLICY "Allow deleting from listing-images bucket" ON storage.objects 
USING ((((select auth.uid()) IS NOT NULL) AND (bucket_id = 'listing-images'::text)));

-- 8. ОБНОВИТЬ СТАТИСТИКУ
-- =================================================================
ANALYZE public.dealers;
ANALYZE public.listings;
ANALYZE public.listing_images;
ANALYZE public.user_profiles;
ANALYZE public.individual_payments;
ANALYZE public.dealer_subscriptions;

-- =================================================================
-- ПРОВЕРКА РЕЗУЛЬТАТА (выполните после всех команд):
-- =================================================================
SELECT 
    'ФИНАЛЬНАЯ ПРОВЕРКА' as status,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' THEN '❌ НЕ ОПТИМИЗИРОВАНО'
        WHEN qual LIKE '%(select auth.uid())%' THEN '✅ ОПТИМИЗИРОВАНО'
        ELSE '➖ БЕЗ AUTH.UID'
    END as optimization_status
FROM pg_policies 
WHERE qual LIKE '%auth.uid()%'
ORDER BY tablename, policyname;