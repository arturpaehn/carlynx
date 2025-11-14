-- ============================================
-- DealerCenter Integration Tables
-- ============================================
-- This migration creates tables for DealerCenter partnership
-- DealerCenter dealers do NOT have user accounts - they use token-based activation

-- Create dealercenter_dealers table
CREATE TABLE IF NOT EXISTS dealercenter_dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Activation & Identity
  activation_token text UNIQUE NOT NULL,
  dealer_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  
  -- Subscription Info
  tier_id uuid REFERENCES subscription_tiers(tier_id),
  subscription_status text DEFAULT 'pending', -- 'pending', 'active', 'expired', 'canceled'
  max_listings int, -- copied from tier for historical record
  
  -- Dates
  activation_date timestamptz, -- when dealer paid and activated
  expiration_date timestamptz, -- 30 days from activation
  
  -- Stripe
  stripe_payment_intent_id text, -- one-time payment
  stripe_customer_id text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Notes from DealerCenter
  notes text,
  
  -- Check subscription_status values
  CONSTRAINT dealercenter_subscription_status_check 
    CHECK (subscription_status IN ('pending', 'active', 'expired', 'canceled'))
);

-- Indexes for fast lookups
CREATE INDEX idx_dealercenter_token ON dealercenter_dealers(activation_token);
CREATE INDEX idx_dealercenter_email ON dealercenter_dealers(contact_email);
CREATE INDEX idx_dealercenter_status ON dealercenter_dealers(subscription_status);
CREATE INDEX idx_dealercenter_expiration ON dealercenter_dealers(expiration_date);

-- Add source tracking to external_listings (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'external_listings_source_check'
  ) THEN
    ALTER TABLE external_listings 
    DROP CONSTRAINT IF EXISTS external_listings_source_check;
  END IF;
END $$;

-- Update external_listings to allow 'dealercenter' source
ALTER TABLE external_listings 
  ADD CONSTRAINT external_listings_source_check 
  CHECK (source IN ('mars_dealership', 'preowned_plus', 'autoboutique', 'autocenter', 'dream_machines', 'dealercenter'));

-- Function to auto-expire DealerCenter subscriptions
CREATE OR REPLACE FUNCTION expire_dealercenter_subscriptions()
RETURNS void AS $$
BEGIN
  -- Mark subscriptions as expired
  UPDATE dealercenter_dealers
  SET 
    subscription_status = 'expired',
    updated_at = now()
  WHERE 
    subscription_status = 'active'
    AND expiration_date < now();
  
  -- Deactivate their listings
  UPDATE external_listings
  SET 
    is_active = false,
    updated_at = now()
  WHERE 
    source = 'dealercenter'
    AND is_active = true
    AND external_id IN (
      SELECT 'DC-' || activation_token
      FROM dealercenter_dealers
      WHERE subscription_status = 'expired'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if dealer can add more listings
CREATE OR REPLACE FUNCTION dealercenter_can_add_listing(p_token text)
RETURNS boolean AS $$
DECLARE
  v_dealer dealercenter_dealers%ROWTYPE;
  v_active_count int;
BEGIN
  -- Get dealer info
  SELECT * INTO v_dealer
  FROM dealercenter_dealers
  WHERE activation_token = p_token;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if subscription is active
  IF v_dealer.subscription_status != 'active' THEN
    RETURN false;
  END IF;
  
  -- Check if expired
  IF v_dealer.expiration_date < now() THEN
    RETURN false;
  END IF;
  
  -- Count active listings
  SELECT COUNT(*) INTO v_active_count
  FROM external_listings
  WHERE source = 'dealercenter'
    AND external_id LIKE 'DC-' || p_token || '-%'
    AND is_active = true;
  
  -- Check against limit (NULL = unlimited)
  IF v_dealer.max_listings IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN v_active_count < v_dealer.max_listings;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_dealercenter_dealers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dealercenter_dealers_updated_at
  BEFORE UPDATE ON dealercenter_dealers
  FOR EACH ROW
  EXECUTE FUNCTION update_dealercenter_dealers_updated_at();

-- RLS Policies
ALTER TABLE dealercenter_dealers ENABLE ROW LEVEL SECURITY;

-- Allow public to read active dealers (for displaying contact info)
CREATE POLICY "Allow public read active dealercenter dealers"
  ON dealercenter_dealers
  FOR SELECT
  USING (subscription_status = 'active');

-- Only service role can insert/update
CREATE POLICY "Service role can manage dealercenter dealers"
  ON dealercenter_dealers
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE dealercenter_dealers IS 'DealerCenter partnership dealers - token-based activation, no user accounts';
COMMENT ON COLUMN dealercenter_dealers.activation_token IS 'Unique token for dealer activation link: /dealers/activate/{token}';
COMMENT ON COLUMN dealercenter_dealers.subscription_status IS 'pending: not paid yet | active: paid and active | expired: 30 days passed | canceled: manually canceled';
COMMENT ON COLUMN dealercenter_dealers.max_listings IS 'Copied from tier at activation time for historical record';
COMMENT ON FUNCTION expire_dealercenter_subscriptions() IS 'Run daily via cron to expire subscriptions and deactivate listings';
COMMENT ON FUNCTION dealercenter_can_add_listing(text) IS 'Check if dealer can add more listings based on tier limit';
