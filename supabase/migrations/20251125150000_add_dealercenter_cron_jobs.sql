-- Migration: Add cron jobs for DealerCenter subscription management
-- Created: 2025-11-25
-- Requires: pg_cron extension

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. Listing Limits Enforcement (Every 6 hours)
-- ============================================
SELECT cron.schedule(
  'enforce-dealercenter-listing-limits',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$SELECT enforce_all_dealercenter_limits()$$
);

-- ============================================
-- 2. Expire DealerCenter Subscriptions (Daily at 2 AM)
-- ============================================
SELECT cron.schedule(
  'expire-dealercenter-subscriptions',
  '0 2 * * *', -- Daily at 2:00 AM
  $$
    UPDATE dealercenter_dealers
    SET subscription_status = 'cancelled'
    WHERE subscription_status IN ('active', 'past_due')
      AND expiration_date IS NOT NULL
      AND expiration_date < NOW();
  $$
);

-- ============================================
-- 3. Deactivate Listings for Expired Dealers (Daily at 2:15 AM)
-- ============================================
SELECT cron.schedule(
  'deactivate-expired-dealer-listings',
  '15 2 * * *', -- Daily at 2:15 AM (15 min after expiry check)
  $$
    UPDATE external_listings el
    SET is_active = false,
        updated_at = NOW()
    FROM dealercenter_dealers dc
    WHERE el.source = 'dealercenter'
      AND el.external_id LIKE 'DC-' || dc.activation_token || '-%'
      AND el.is_active = true
      AND dc.subscription_status IN ('cancelled', 'pending')
      AND dc.activation_date IS NOT NULL
      AND dc.activation_date < NOW() - INTERVAL '30 days';
  $$
);

-- ============================================
-- 4. Send Expiring Soon Notifications (Daily at 10 AM)
-- ============================================
-- This would ideally call an API endpoint to send emails
-- For now, we'll create a function that logs dealers expiring soon

CREATE OR REPLACE FUNCTION check_expiring_dealercenter_subscriptions()
RETURNS TABLE (
  dealer_id uuid,
  dealer_name text,
  contact_email text,
  expiration_date timestamptz,
  days_left int
)
LANGUAGE sql
AS $$
  SELECT 
    id,
    dealer_name,
    contact_email,
    expiration_date,
    EXTRACT(DAY FROM (expiration_date - NOW()))::int as days_left
  FROM dealercenter_dealers
  WHERE subscription_status = 'active'
    AND expiration_date IS NOT NULL
    AND expiration_date > NOW()
    AND expiration_date < NOW() + INTERVAL '7 days'
  ORDER BY expiration_date ASC;
$$;

GRANT EXECUTE ON FUNCTION check_expiring_dealercenter_subscriptions() TO postgres, service_role;

SELECT cron.schedule(
  'check-expiring-dealercenter-subscriptions',
  '0 10 * * *', -- Daily at 10:00 AM
  $$SELECT * FROM check_expiring_dealercenter_subscriptions()$$
);

-- ============================================
-- View current cron jobs
-- ============================================
COMMENT ON EXTENSION pg_cron IS 'DealerCenter subscription management cron jobs';

-- To view all scheduled jobs:
-- SELECT * FROM cron.job WHERE jobname LIKE '%dealercenter%';

-- To unschedule a job:
-- SELECT cron.unschedule('job-name-here');
