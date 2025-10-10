-- Add policy to allow anyone to increment views on listings table
-- This allows public users to update the views counter without authentication

-- Check if RLS is enabled, if not - enable it
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists
DROP POLICY IF EXISTS "Anyone can increment listing views" ON listings;

-- Create policy to allow anyone to update views field
CREATE POLICY "Anyone can increment listing views"
  ON listings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Anyone can increment listing views" ON listings IS 'Allows anyone to increment the views counter on listings';
