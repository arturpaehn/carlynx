-- Check Dream Machines listings in DEV database
-- Run this in Supabase SQL Editor for: kjntriyhqpfxqciaxbpj

SELECT 
  id,
  title,
  year,
  brand,
  model,
  vehicle_type,
  price,
  mileage,
  CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN image_url_2 IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN image_url_3 IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN image_url_4 IS NOT NULL THEN 1 ELSE 0 END as image_count,
  source,
  is_active,
  created_at
FROM external_listings
WHERE source = 'dream_machines_texas'
ORDER BY created_at DESC
LIMIT 10;

-- Check if vehicle_type is correct (should be 'motorcycle' lowercase)
-- If it shows 'Motorcycle' with capital M, need to update
