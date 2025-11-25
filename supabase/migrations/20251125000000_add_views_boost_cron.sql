-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to boost views with random increment (7-21)
CREATE OR REPLACE FUNCTION boost_all_listing_views()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  listings_updated integer := 0;
  external_listings_updated integer := 0;
BEGIN
  -- Boost views for regular listings (int8)
  UPDATE listings
  SET views = views + floor(random() * 15 + 7)::int8  -- Random 7-21
  WHERE is_active = true;
  
  GET DIAGNOSTICS listings_updated = ROW_COUNT;
  
  -- Boost views for external_listings (int4)
  UPDATE external_listings
  SET views = views + floor(random() * 15 + 7)::int4  -- Random 7-21
  WHERE is_active = true;
  
  GET DIAGNOSTICS external_listings_updated = ROW_COUNT;
  
  -- Log the operation
  RAISE NOTICE 'Views boosted: % listings, % external_listings', 
    listings_updated, external_listings_updated;
END;
$$;

-- Schedule cron jobs for Texas timezone (CST/CDT)
-- Texas 6:00 AM = 12:00 UTC (CST) or 11:00 UTC (CDT during daylight saving)
-- Texas 12:00 AM (midnight) = 06:00 UTC (CST) or 05:00 UTC (CDT)
-- Using CST times (standard time)

-- Job 1: Daily at 12:00 UTC (6:00 AM Texas CST)
SELECT cron.schedule(
  'boost-views-morning',           -- job name
  '0 12 * * *',                    -- cron expression: 12:00 UTC daily
  $$SELECT boost_all_listing_views();$$
);

-- Job 2: Daily at 06:00 UTC (12:00 AM Texas CST)
SELECT cron.schedule(
  'boost-views-midnight',          -- job name
  '0 6 * * *',                     -- cron expression: 06:00 UTC daily
  $$SELECT boost_all_listing_views();$$
);

-- View scheduled jobs
COMMENT ON FUNCTION boost_all_listing_views() IS 
  'Boosts views for all active listings by random amount (7-21) twice daily';

-- Check created jobs (optional, for verification)
-- SELECT * FROM cron.job WHERE jobname LIKE 'boost-views%';
