-- Add engine_size column to external_listings table
-- This field stores engine displacement in liters (e.g., "5.3", "2.0", "1.8")

ALTER TABLE external_listings 
ADD COLUMN IF NOT EXISTS engine_size TEXT;

-- Add comment for documentation
COMMENT ON COLUMN external_listings.engine_size IS 'Engine displacement in liters (e.g., "5.3", "2.0")';

-- Create index for filtering by engine size
CREATE INDEX IF NOT EXISTS idx_external_listings_engine_size 
ON external_listings(engine_size) 
WHERE engine_size IS NOT NULL;
