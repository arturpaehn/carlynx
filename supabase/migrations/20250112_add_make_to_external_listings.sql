-- Add 'make' column to external_listings table
-- Date: 2025-01-12
-- This column stores the vehicle manufacturer (e.g., Toyota, Ford, BMW)

ALTER TABLE external_listings 
ADD COLUMN IF NOT EXISTS make text;

-- Add index for faster filtering by make
CREATE INDEX IF NOT EXISTS idx_external_listings_make ON external_listings(make);

COMMENT ON COLUMN external_listings.make IS 'Vehicle manufacturer/brand (e.g., Toyota, Ford, BMW)';
