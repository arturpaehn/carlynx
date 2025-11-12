-- ============================================
-- Add VIN (Vehicle Identification Number) to listings tables
-- ============================================
-- Add VIN column to both listings and external_listings tables
-- VIN is NOT NULL for new regular listings (user-created)
-- VIN is optional for external_listings (from parsers, to be added later)

-- Add VIN to regular listings table (REQUIRED for new listings)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS vin VARCHAR(17);

-- Add VIN to external listings table (OPTIONAL, parsers will be updated later)
ALTER TABLE external_listings 
ADD COLUMN IF NOT EXISTS vin VARCHAR(17);

-- Add comments for documentation
COMMENT ON COLUMN listings.vin IS 'Vehicle Identification Number (VIN) - 17 characters, required for new listings';
COMMENT ON COLUMN external_listings.vin IS 'Vehicle Identification Number (VIN) - 17 characters, optional until parsers are updated';

-- Create index for faster VIN lookups
CREATE INDEX IF NOT EXISTS idx_listings_vin ON listings(vin) WHERE vin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_external_listings_vin ON external_listings(vin) WHERE vin IS NOT NULL;

-- ============================================
-- Migration Complete
-- ============================================
-- Next steps:
-- 1. Update frontend forms to include VIN field (required)
-- 2. Update parsers to extract VIN codes
-- 3. Display VIN on listing detail pages
