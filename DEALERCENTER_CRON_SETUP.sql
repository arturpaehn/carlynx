-- ============================================
-- DealerCenter Cron Job Setup
-- ============================================
-- This sets up automatic daily expiration of DealerCenter subscriptions
-- Runs at 2:00 AM UTC every day
-- Database: https://nusnffvsnhmqxoeqjhjs.supabase.co

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily job to expire subscriptions
-- Note: If job already exists, unschedule it first manually:
-- SELECT cron.unschedule('expire-dealercenter-subscriptions');
-- Runs every day at 2:00 AM UTC
SELECT cron.schedule(
  'expire-dealercenter-subscriptions',  -- job name
  '0 2 * * *',                          -- cron schedule (minute hour day month weekday)
  $$SELECT expire_dealercenter_subscriptions()$$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'expire-dealercenter-subscriptions';

-- To check job execution history later:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-dealercenter-subscriptions') ORDER BY start_time DESC LIMIT 10;

-- To manually trigger the job for testing:
-- SELECT expire_dealercenter_subscriptions();

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('expire-dealercenter-subscriptions');
