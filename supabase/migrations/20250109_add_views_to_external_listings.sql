-- Add views column to external_listings table
ALTER TABLE external_listings
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;

-- Add index for potential sorting by views
CREATE INDEX IF NOT EXISTS idx_external_listings_views ON external_listings(views);

-- Allow anyone to update views count (for incrementing on page view)
CREATE POLICY "Anyone can increment views"
  ON external_listings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON COLUMN external_listings.views IS 'Number of times this external listing has been viewed';
