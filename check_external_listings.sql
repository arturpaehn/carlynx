-- Check external listings data with contacts
SELECT 
  id,
  title,
  price,
  year,
  model,
  is_active,
  source,
  external_url,
  contact_phone,
  contact_email,
  image_url,
  created_at,
  updated_at
FROM external_listings
ORDER BY updated_at DESC
LIMIT 5;

-- Count active external listings
SELECT COUNT(*) as active_count 
FROM external_listings 
WHERE is_active = true;

-- Check if images are uploaded
SELECT 
  id,
  title,
  CASE 
    WHEN image_url LIKE '%supabase%' THEN 'Uploaded to Storage'
    ELSE 'External URL'
  END as image_status
FROM external_listings
LIMIT 5;
