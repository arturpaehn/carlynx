-- Migration: Enable RLS for subscription_tiers and user_payment_history
-- Description: Safely enable Row Level Security without breaking payment functionality
-- Date: 2025-01-03

-- ============================================================
-- 1. Enable RLS on subscription_tiers
-- ============================================================

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active subscription tiers
-- This is needed for: registration page, dealer dashboard, subscription selection
CREATE POLICY "Anyone can view active subscription tiers"
  ON subscription_tiers
  FOR SELECT
  TO public
  USING (active = true);

-- Only service role can modify tiers (admin operations)
-- This prevents users from modifying pricing
CREATE POLICY "Service role can manage subscription tiers"
  ON subscription_tiers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE subscription_tiers IS 'Subscription pricing tiers - public read, admin write';

-- ============================================================
-- 2. Enable RLS on user_payment_history VIEW
-- ============================================================

-- Note: user_payment_history is a VIEW, not a table
-- RLS is controlled by the underlying tables (individual_payments and listings)
-- Both tables already have RLS enabled

-- Verify that individual_payments has correct RLS
DO $$
BEGIN
  -- Check if RLS is enabled on individual_payments
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'individual_payments' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on individual_payments table!';
  END IF;
  
  RAISE NOTICE '✅ RLS is properly enabled on individual_payments';
END $$;

-- Additional policy for Stripe webhook to update payments
-- The webhook uses service_role key, so it bypasses RLS
-- But we add explicit policy for clarity
CREATE POLICY "Service role can manage all payments"
  ON individual_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Service role can manage all payments" 
  ON individual_payments 
  IS 'Allows Stripe webhooks and admin operations to update payment records';

-- ============================================================
-- 3. Summary and verification
-- ============================================================

-- Show current RLS status
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'RLS Status Summary:';
  RAISE NOTICE '============================================================';
  
  FOR rec IN 
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('subscription_tiers', 'individual_payments', 'dealers', 'dealer_subscriptions')
    ORDER BY tablename
  LOOP
    RAISE NOTICE '% RLS: %', 
      RPAD(rec.tablename, 25, ' '), 
      CASE WHEN rec.rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END;
  END LOOP;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================
-- Testing queries (run these to verify)
-- ============================================================

-- Test 1: Can anonymous users see subscription tiers?
-- SELECT tier_id, tier_name, monthly_price FROM subscription_tiers WHERE active = true;

-- Test 2: Can authenticated users see their own payments?
-- SELECT * FROM user_payment_history WHERE user_id = auth.uid();

-- Test 3: Can service role (admin) access everything?
-- (This runs with service_role key in API routes)

-- ============================================================
-- IMPORTANT NOTES:
-- ============================================================
-- ✅ subscription_tiers: Public READ (for pricing display), Admin WRITE only
-- ✅ individual_payments: Users can only see their own, Service role can modify all
-- ✅ user_payment_history: VIEW - inherits RLS from underlying tables
-- ✅ Stripe webhooks use service_role key → bypass RLS (intentional)
-- ✅ All API routes using admin client → bypass RLS (intentional)
-- ✅ Payment functionality: NOT affected (webhooks and admin routes work as before)
