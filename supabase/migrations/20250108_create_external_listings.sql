-- Create external_listings table for scraped listings from partner sites
CREATE TABLE IF NOT EXISTS external_listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id text UNIQUE NOT NULL,
  source text NOT NULL DEFAULT 'mars_dealership',
  external_url text NOT NULL,
  
  -- Vehicle info
  title text NOT NULL,
  model text,
  year integer,
  price numeric(10,2),
  transmission text,
  mileage integer,
  fuel_type text,
  vehicle_type text DEFAULT 'car',
  
  -- Images
  image_url text,
  
  -- Contact (same for all Mars Dealership listings)
  contact_phone text DEFAULT '+1 682 360 3867',
  contact_email text DEFAULT 'marsdealership@gmail.com',
  
  -- Location
  state_id integer REFERENCES states(id),
  city_id integer,
  city_name text,
  
  -- Sync metadata
  last_seen_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_external_listings_external_id ON external_listings(external_id);
CREATE INDEX idx_external_listings_source ON external_listings(source);
CREATE INDEX idx_external_listings_is_active ON external_listings(is_active);
CREATE INDEX idx_external_listings_last_seen ON external_listings(last_seen_at);
CREATE INDEX idx_external_listings_state ON external_listings(state_id);

-- Enable RLS
ALTER TABLE external_listings ENABLE ROW LEVEL SECURITY;

-- Public can read active external listings
CREATE POLICY "External listings are viewable by everyone"
  ON external_listings
  FOR SELECT
  USING (is_active = true);

-- Only service role can manage external listings
CREATE POLICY "Service role can manage external listings"
  ON external_listings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_external_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_external_listings_timestamp
  BEFORE UPDATE ON external_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_external_listings_updated_at();

-- Create storage bucket for external listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('external-listing-images', 'external-listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for external listing images
CREATE POLICY "External images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'external-listing-images');

CREATE POLICY "Service role can upload external images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'external-listing-images' 
    AND auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role can delete external images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'external-listing-images' 
    AND auth.jwt() ->> 'role' = 'service_role'
  );

COMMENT ON TABLE external_listings IS 'Listings scraped from external partner sites like Mars Dealership';
COMMENT ON COLUMN external_listings.external_id IS 'Unique identifier from the source website';
COMMENT ON COLUMN external_listings.last_seen_at IS 'Last time this listing was found during scraping';
