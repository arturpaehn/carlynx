-- Fix RLS policies for external_listings to allow public views increment
-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Service role can manage external listings" ON external_listings;
DROP POLICY IF EXISTS "Service role can insert external listings" ON external_listings;
DROP POLICY IF EXISTS "Service role can delete external listings" ON external_listings;
DROP POLICY IF EXISTS "Service role can update external listings" ON external_listings;
DROP POLICY IF EXISTS "Anyone can increment views" ON external_listings;
DROP POLICY IF EXISTS "Public can increment views" ON external_listings;

-- Recreate policies with proper separation
-- Service role can do ANYTHING (no restrictions)
CREATE POLICY "Service role full access"
  ON external_listings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anyone can update (for views increment)
CREATE POLICY "Public can update external listings"
  ON external_listings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Public can update external listings" ON external_listings IS 'Allows anyone to update external listings (for views increment)';
