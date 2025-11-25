-- Migration: Add listing limits enforcement for DealerCenter
-- Created: 2025-11-25

-- Function to check and enforce listing limits for DealerCenter dealers
CREATE OR REPLACE FUNCTION check_dealercenter_listing_limits()
RETURNS TABLE (
  dealer_id uuid,
  dealer_name text,
  max_listings int,
  active_count int,
  excess_count int,
  action text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH dealer_stats AS (
    SELECT 
      dc.id,
      dc.dealer_name,
      dc.max_listings,
      dc.subscription_status,
      dc.activation_token,
      COUNT(el.id) FILTER (WHERE el.is_active = true) as active_listings
    FROM dealercenter_dealers dc
    LEFT JOIN external_listings el 
      ON el.source = 'dealercenter' 
      AND el.external_id LIKE 'DC-' || dc.activation_token || '-%'
    WHERE dc.subscription_status IN ('active', 'pending', 'past_due')
    GROUP BY dc.id, dc.dealer_name, dc.max_listings, dc.subscription_status, dc.activation_token
  )
  SELECT 
    ds.id,
    ds.dealer_name,
    ds.max_listings,
    ds.active_listings::int,
    GREATEST(0, ds.active_listings - ds.max_listings)::int as excess,
    CASE 
      WHEN ds.active_listings > ds.max_listings THEN 'DEACTIVATE_EXCESS'
      WHEN ds.active_listings <= ds.max_listings THEN 'OK'
      ELSE 'ERROR'
    END as action
  FROM dealer_stats ds
  WHERE ds.active_listings > ds.max_listings;
END;
$$;

-- Function to deactivate excess listings for a specific dealer
CREATE OR REPLACE FUNCTION deactivate_excess_dealercenter_listings(dealer_activation_token text, keep_count int)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deactivated_count int;
BEGIN
  -- Deactivate oldest listings that exceed the limit
  -- Keep the most recently seen listings active
  WITH listings_to_deactivate AS (
    SELECT id
    FROM external_listings
    WHERE source = 'dealercenter'
      AND external_id LIKE 'DC-' || dealer_activation_token || '-%'
      AND is_active = true
    ORDER BY last_seen_at ASC NULLS FIRST, created_at ASC
    OFFSET keep_count
  )
  UPDATE external_listings
  SET is_active = false,
      updated_at = NOW()
  WHERE id IN (SELECT id FROM listings_to_deactivate)
  RETURNING id INTO deactivated_count;

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  
  RETURN deactivated_count;
END;
$$;

-- Function to enforce limits for all dealers (called by cron)
CREATE OR REPLACE FUNCTION enforce_all_dealercenter_limits()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  dealer_record RECORD;
  total_deactivated int := 0;
  dealers_affected int := 0;
  result_json json;
BEGIN
  -- Loop through dealers with excess listings
  FOR dealer_record IN 
    SELECT * FROM check_dealercenter_listing_limits()
  LOOP
    -- Get activation token
    DECLARE
      activation_token text;
      deactivated int;
    BEGIN
      SELECT dc.activation_token 
      INTO activation_token
      FROM dealercenter_dealers dc 
      WHERE dc.id = dealer_record.dealer_id;

      -- Deactivate excess listings
      SELECT deactivate_excess_dealercenter_listings(activation_token, dealer_record.max_listings)
      INTO deactivated;

      total_deactivated := total_deactivated + deactivated;
      dealers_affected := dealers_affected + 1;

      RAISE NOTICE 'Dealer %: Deactivated % excess listings (max: %, had: %)', 
        dealer_record.dealer_name, 
        deactivated, 
        dealer_record.max_listings, 
        dealer_record.active_count;
    END;
  END LOOP;

  result_json := json_build_object(
    'success', true,
    'dealers_affected', dealers_affected,
    'total_deactivated', total_deactivated,
    'timestamp', NOW()
  );

  RETURN result_json;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_dealercenter_listing_limits() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION deactivate_excess_dealercenter_listings(text, int) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION enforce_all_dealercenter_limits() TO postgres, service_role;

-- Add comment
COMMENT ON FUNCTION check_dealercenter_listing_limits() IS 'Returns dealers with active listing count exceeding their max_listings limit';
COMMENT ON FUNCTION deactivate_excess_dealercenter_listings(text, int) IS 'Deactivates oldest listings for a dealer to enforce limit';
COMMENT ON FUNCTION enforce_all_dealercenter_limits() IS 'Enforces listing limits for all DealerCenter dealers (run by cron)';
