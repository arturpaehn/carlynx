-- Migration: Add automatic cleanup for inactive listings
-- Created: 2025-12-16
-- Deactivates listings after 30 days of inactivity
-- Deletes listings after 180 days of inactivity

-- Ensure pg_cron is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. Deactivate inactive listings after 30 days (Daily at 3 AM)
-- ============================================
SELECT cron.schedule(
  'deactivate-inactive-listings-30d',
  '0 3 * * *', -- Daily at 3:00 AM
  $$
    UPDATE listings
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true
      AND source IS NULL  -- Only for non-dealercenter listings
      AND (
        (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '30 days')
        OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
      );
  $$
);

-- ============================================
-- 2. Delete inactive listings after 180 days (Daily at 3:15 AM)
-- ============================================
SELECT cron.schedule(
  'delete-inactive-listings-180d',
  '15 3 * * *', -- Daily at 3:15 AM (15 min after deactivation check)
  $$
    -- Delete associated listing images first
    DELETE FROM listing_images
    WHERE listing_id IN (
      SELECT id FROM listings
      WHERE is_active = false
        AND source IS NULL  -- Only for non-dealercenter listings
        AND (
          (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '180 days')
          OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '180 days')
        )
    );

    -- Then delete listings
    DELETE FROM listings
    WHERE is_active = false
      AND source IS NULL  -- Only for non-dealercenter listings
      AND (
        (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '180 days')
        OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '180 days')
      );
  $$
);

-- ============================================
-- Helper function to manually trigger cleanup
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_inactive_listings()
RETURNS TABLE (
  deactivated_count bigint,
  deleted_count bigint,
  deleted_images_count bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_deactivated_count bigint;
  v_deleted_images_count bigint;
  v_deleted_count bigint;
BEGIN
  -- Deactivate listings inactive for 30+ days
  UPDATE listings
  SET is_active = false,
      updated_at = NOW()
  WHERE is_active = true
    AND source IS NULL
    AND (
      (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '30 days')
      OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
    );
  
  GET DIAGNOSTICS v_deactivated_count = ROW_COUNT;

  -- Delete images for listings inactive for 180+ days
  DELETE FROM listing_images
  WHERE listing_id IN (
    SELECT id FROM listings
    WHERE is_active = false
      AND source IS NULL
      AND (
        (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '180 days')
        OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '180 days')
      )
  );
  
  GET DIAGNOSTICS v_deleted_images_count = ROW_COUNT;

  -- Delete listings inactive for 180+ days
  DELETE FROM listings
  WHERE is_active = false
    AND source IS NULL
    AND (
      (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '180 days')
      OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '180 days')
    );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN QUERY SELECT v_deactivated_count, v_deleted_count, v_deleted_images_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_inactive_listings() TO postgres, service_role;

-- ============================================
-- View statistics about inactive listings
-- ============================================
CREATE OR REPLACE FUNCTION get_inactive_listings_stats()
RETURNS TABLE (
  total_inactive bigint,
  deactivated_30d_count bigint,
  deleted_180d_count bigint
)
LANGUAGE sql
AS $$
  SELECT
    (SELECT COUNT(*) FROM listings WHERE is_active = false AND source IS NULL),
    (SELECT COUNT(*) FROM listings 
     WHERE is_active = false 
       AND source IS NULL
       AND (
         (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '30 days')
         OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
       )),
    (SELECT COUNT(*) FROM listings
     WHERE is_active = false
       AND source IS NULL
       AND (
         (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '180 days')
         OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '180 days')
       ))
$$;

GRANT EXECUTE ON FUNCTION get_inactive_listings_stats() TO postgres, service_role;

-- ============================================
-- Comments
-- ============================================
COMMENT ON FUNCTION cleanup_inactive_listings() IS 'Manually triggers cleanup of inactive listings: deactivates after 30d, deletes after 180d';
COMMENT ON FUNCTION get_inactive_listings_stats() IS 'Returns statistics about inactive listings and scheduled cleanup counts';

-- View all cleanup-related cron jobs
-- SELECT * FROM cron.job WHERE jobname LIKE '%listings%';

-- To unschedule jobs:
-- SELECT cron.unschedule('deactivate-inactive-listings-30d');
-- SELECT cron.unschedule('delete-inactive-listings-180d');
