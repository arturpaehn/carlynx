-- Function to enforce listing limits for individual users
-- Note: NO LIMITS! Users can create unlimited listings (each listing = $5 revenue)
-- Dealers table functionality planned for future (subscription model)

CREATE OR REPLACE FUNCTION check_individual_listing_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- NO LIMITS: Individual users can create unlimited listings
  -- Each listing generates $5 revenue, so more listings = more profit!
  -- Simply return NEW to allow all listings
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
