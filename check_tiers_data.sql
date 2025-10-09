-- QUERY 4: SUBSCRIPTION TIERS DATA
SELECT 
    tier_id,
    tier_name,
    monthly_price,
    listing_limit,
    active
FROM subscription_tiers
ORDER BY monthly_price;
