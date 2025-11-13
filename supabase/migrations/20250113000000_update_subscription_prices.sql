-- Migration: Update Subscription Prices
-- Date: 2025-01-13
-- Description: Change dealer subscription prices from old ($400-$3000) to new ($29-$199)

-- Update subscription tier prices
UPDATE subscription_tiers SET monthly_price = 29 WHERE tier_id = 'tier_100';
UPDATE subscription_tiers SET monthly_price = 49 WHERE tier_id = 'tier_250';
UPDATE subscription_tiers SET monthly_price = 79 WHERE tier_id = 'tier_500';
UPDATE subscription_tiers SET monthly_price = 129 WHERE tier_id = 'tier_1000';
UPDATE subscription_tiers SET monthly_price = 199 WHERE tier_id = 'tier_unlimited';

-- Verify the changes
SELECT 
    tier_id,
    tier_name,
    monthly_price,
    listing_limit,
    active
FROM subscription_tiers
ORDER BY COALESCE(listing_limit, 999999);

-- Expected output:
-- tier_100       | Up to 100 listings  | 29   | 100  | true
-- tier_250       | Up to 250 listings  | 49   | 250  | true
-- tier_500       | Up to 500 listings  | 79   | 500  | true
-- tier_1000      | Up to 1000 listings | 129  | 1000 | true
-- tier_unlimited | Unlimited listings  | 199  | NULL | true
