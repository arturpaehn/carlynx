-- =================================================================
-- DATABASE PERFORMANCE OPTIMIZATION
-- Fix Auth RLS, Multiple Policies, and Duplicate Indexes
-- =================================================================

-- 1. OPTIMIZE AUTH RLS POLICIES (Replace auth.uid() with (select auth.uid()))
-- =================================================================

-- Fix user_profiles policies
ALTER POLICY "Users can view own profile" ON public.user_profiles 
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can update own profile" ON public.user_profiles 
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can delete own profile" ON public.user_profiles 
USING ((select auth.uid()) = user_id);

ALTER POLICY "Allow auth operations on own profile" ON public.user_profiles 
USING (((select auth.uid()) = user_id) AND ((auth.jwt() ->> 'aud'::text) = 'authenticated'::text));

-- Fix admin policy
ALTER POLICY "Admin can manage all profiles" ON public.user_profiles 
USING (((select auth.jwt()) ->> 'email'::text) = 'admin@carlynx.us'::text);

-- 2. CONSOLIDATE MULTIPLE POLICIES
-- =================================================================

-- Drop redundant policies for user_profiles (keep most permissive ones)
DROP POLICY IF EXISTS "Allow auth operations on own profile" ON public.user_profiles;
-- (This policy is redundant with "Users can view/update own profile" policies)

-- 3. REMOVE DUPLICATE INDEXES
-- =================================================================

-- Remove duplicate stripe_customer_id index (keep the unique constraint one)
DROP INDEX IF EXISTS idx_dealers_stripe_customer;
-- Keep: idx_dealers_stripe_customer_id

-- Remove duplicate subscription_status index
DROP INDEX IF EXISTS idx_dealers_status;  
-- Keep: idx_dealers_subscription_status

-- Remove redundant user_id index (unique constraint already provides index)
DROP INDEX IF EXISTS idx_dealers_user_id;
-- Keep: dealers_user_id_key (unique constraint)

-- 4. VERIFY REMAINING INDEXES
-- =================================================================
-- After cleanup, dealers table will have these indexes:
-- ✅ dealers_pkey (primary key)
-- ✅ dealers_user_id_key (unique)
-- ✅ dealers_stripe_customer_id_key (unique) 
-- ✅ idx_dealers_subscription_status (performance)
-- ✅ idx_dealers_stripe_customer_id (performance)
-- ✅ idx_dealers_stripe_subscription (performance)
-- ✅ idx_dealers_tier (performance)

-- 5. ANALYZE TABLES FOR QUERY PLANNER
-- =================================================================
ANALYZE public.user_profiles;
ANALYZE public.dealers;

-- =================================================================
-- OPTIMIZATION COMPLETE
-- Expected improvements:
-- ⚡ Faster RLS policy evaluation
-- ⚡ Reduced multiple policy checks
-- ⚡ Faster INSERT/UPDATE operations on dealers
-- =================================================================