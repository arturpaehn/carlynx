-- Add dealer_name column to external_listings table
ALTER TABLE external_listings 
ADD COLUMN IF NOT EXISTS dealer_name text;

COMMENT ON COLUMN external_listings.dealer_name IS 'Name of the dealership/partner from the source website';
