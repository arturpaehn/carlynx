-- Migration: Update Dealer Subscription Tiers ONLY
-- Description: Remove old tiers and keep only new 5 tiers
-- Date: 2025-01-03
-- Run this if you already have dealers tables created

-- ============================================================
-- 1. DELETE OLD TIERS (basic, premium, enterprise)
-- ============================================================

DELETE FROM subscription_tiers WHERE tier_id IN ('basic', 'premium', 'enterprise');

-- ============================================================
-- 2. UPDATE OR INSERT NEW TIERS
-- ============================================================

-- Upsert new tiers (update if exists, insert if not)
INSERT INTO subscription_tiers (tier_id, tier_name, monthly_price, listing_limit, features, stripe_price_id, active) VALUES
  ('tier_100', 'Up to 100 listings', 400.00, 100, '{"verified_badge": true, "priority_support": false, "analytics": false}', NULL, true),
  ('tier_250', 'Up to 250 listings', 800.00, 250, '{"verified_badge": true, "priority_support": true, "analytics": true}', NULL, true),
  ('tier_500', 'Up to 500 listings', 1250.00, 500, '{"verified_badge": true, "priority_support": true, "analytics": true, "featured_listings": 10}', NULL, true),
  ('tier_1000', 'Up to 1000 listings', 2000.00, 1000, '{"verified_badge": true, "priority_support": true, "analytics": true, "featured_listings": 20}', NULL, true),
  ('tier_unlimited', 'Unlimited listings', 3000.00, NULL, '{"verified_badge": true, "priority_support": true, "analytics": true, "featured_listings": "unlimited", "api_access": true}', NULL, true)
ON CONFLICT (tier_id) 
DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  monthly_price = EXCLUDED.monthly_price,
  listing_limit = EXCLUDED.listing_limit,
  features = EXCLUDED.features,
  active = EXCLUDED.active;

-- Verify the changes
SELECT tier_id, tier_name, monthly_price, listing_limit 
FROM subscription_tiers 
ORDER BY COALESCE(listing_limit, 999999);

-- Summary:
-- ✅ Tiers updated/created with correct pricing:
--    • tier_100: $400/mo (up to 100 listings)
--    • tier_250: $800/mo (up to 250 listings)
--    • tier_500: $1,250/mo (up to 500 listings)
--    • tier_1000: $2,000/mo (up to 1000 listings)
--    • tier_unlimited: $3,000/mo (unlimited)
