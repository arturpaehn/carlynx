-- Remove external listings without price (Auto Boutique Texas)
-- These should not have been added in the first place

DELETE FROM external_listings 
WHERE source = 'auto_boutique_texas' 
AND (price IS NULL OR price = 0);

-- Show how many were deleted
SELECT 'Deleted listings without price from Auto Boutique Texas' as message;
