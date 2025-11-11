-- ============================================
-- Add Multiple Images Support to external_listings
-- ============================================
-- Add 3 additional image columns to store up to 4 images per listing
-- image_url = first/main image (already exists)
-- image_url_2, image_url_3, image_url_4 = additional images

-- Add new columns
ALTER TABLE external_listings 
ADD COLUMN IF NOT EXISTS image_url_2 TEXT,
ADD COLUMN IF NOT EXISTS image_url_3 TEXT,
ADD COLUMN IF NOT EXISTS image_url_4 TEXT;

-- Add comments for documentation
COMMENT ON COLUMN external_listings.image_url IS 'Main/first image URL';
COMMENT ON COLUMN external_listings.image_url_2 IS 'Second image URL';
COMMENT ON COLUMN external_listings.image_url_3 IS 'Third image URL';
COMMENT ON COLUMN external_listings.image_url_4 IS 'Fourth image URL';

-- ============================================
-- Migration Complete
-- ============================================
-- Next steps:
-- 1. Update parsers to fetch and store 4 images
-- 2. Update frontend to display all 4 images in gallery
-- 3. Update API endpoints to return all image URLs
