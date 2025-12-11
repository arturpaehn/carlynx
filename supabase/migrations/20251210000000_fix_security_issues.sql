-- Migration to fix Supabase security linter errors
-- 1. Remove SECURITY DEFINER from user_payment_history view (view is UNUSED - just drop it)
-- 2. Enable RLS on dealercenter_import_logs table

-- Fix 1: Drop user_payment_history view completely
-- This view is not used anywhere in the codebase and was likely created manually
-- Payment systems:
--   - Individual users: individual_payments table (for $2.50 listing payments)
--   - Registered dealers: user accounts with tier subscriptions (has user_id)
--   - DealerCenter dealers: dealercenter_dealers table (NO user_id - token-based)
DROP VIEW IF EXISTS public.user_payment_history;

-- Fix 2: Enable RLS on dealercenter_import_logs table
ALTER TABLE public.dealercenter_import_logs ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admins can view import logs
CREATE POLICY "Admin users can view dealercenter import logs"
  ON public.dealercenter_import_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Create policy: Only admins can insert import logs
CREATE POLICY "Admin users can insert dealercenter import logs"
  ON public.dealercenter_import_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Create policy: Service role can insert import logs (for API routes)
CREATE POLICY "Service role can insert dealercenter import logs"
  ON public.dealercenter_import_logs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
  );

-- Create policy: Service role can view import logs (for API routes)
CREATE POLICY "Service role can view dealercenter import logs"
  ON public.dealercenter_import_logs
  FOR SELECT
  USING (
    auth.role() = 'service_role'
  );

-- Add comment explaining RLS policies
COMMENT ON TABLE public.dealercenter_import_logs IS 'Logs for DealerCenter CSV feed imports - RLS enabled, accessible only to admins and service role';
