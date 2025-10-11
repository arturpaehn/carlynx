-- Remove email from Auto Boutique Texas listings
-- User doesn't want to show email, only phone

UPDATE external_listings 
SET contact_email = NULL
WHERE source = 'auto_boutique_texas';

-- Show result
SELECT 'Updated Auto Boutique Texas listings - removed email' as message;
