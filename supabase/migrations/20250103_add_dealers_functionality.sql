-- Migration: Add Dealers Functionality
-- Description: Add dealer accounts with subscription-based pricing model
-- Date: 2025-01-03

-- ============================================================
-- 1. Create profiles table and add user_type column
-- ============================================================

-- Add user_type column to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'individual' CHECK (user_type IN ('individual', 'dealer'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

COMMENT ON COLUMN user_profiles.user_type IS 'Type of user account: individual (pay per listing) or dealer (subscription)';

-- ============================================================
-- 2. Create dealers table
-- ============================================================

CREATE TABLE IF NOT EXISTS dealers (
  dealer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_phone TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  
  -- Subscription details
  subscription_tier TEXT NOT NULL DEFAULT 'tier_100' CHECK (subscription_tier IN ('tier_100', 'tier_250', 'tier_500', 'tier_1000', 'tier_unlimited')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  
  -- Limits based on tier
  monthly_listing_limit INTEGER DEFAULT 100, -- NULL means unlimited
  current_month_listings_count INTEGER DEFAULT 0,
  
  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  -- Metadata
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dealers_user_id ON dealers(user_id);
CREATE INDEX IF NOT EXISTS idx_dealers_subscription_status ON dealers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_dealers_stripe_customer_id ON dealers(stripe_customer_id);

-- Add comment
COMMENT ON TABLE dealers IS 'Dealer accounts with subscription-based pricing';

-- ============================================================
-- 3. Create dealer_subscriptions table (for history)
-- ============================================================

CREATE TABLE IF NOT EXISTS dealer_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealer_id UUID NOT NULL REFERENCES dealers(dealer_id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  
  tier TEXT NOT NULL CHECK (tier IN ('tier_100', 'tier_250', 'tier_500', 'tier_1000', 'tier_unlimited')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  
  amount DECIMAL(10,2) NOT NULL, -- Monthly price
  currency TEXT DEFAULT 'USD',
  
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dealer_subscriptions_dealer_id ON dealer_subscriptions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_subscriptions_status ON dealer_subscriptions(status);

COMMENT ON TABLE dealer_subscriptions IS 'History of dealer subscription payments and changes';

-- ============================================================
-- 4. Add created_by_type to listings (already exists, just ensure)
-- ============================================================

-- Already exists from previous migration, just verify
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'created_by_type'
  ) THEN
    ALTER TABLE listings ADD COLUMN created_by_type TEXT DEFAULT 'individual' CHECK (created_by_type IN ('individual', 'dealer'));
  END IF;
END $$;

-- Add dealer_id reference to listings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'dealer_id'
  ) THEN
    ALTER TABLE listings ADD COLUMN dealer_id UUID REFERENCES dealers(dealer_id) ON DELETE SET NULL;
    CREATE INDEX idx_listings_dealer_id ON listings(dealer_id);
  END IF;
END $$;

-- ============================================================
-- 5. Update check_individual_listing_limit function
-- ============================================================

-- This function now checks user type before applying limits
CREATE OR REPLACE FUNCTION check_individual_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_account_type TEXT;
  dealer_subscription_status TEXT;
  dealer_monthly_limit INTEGER;
  dealer_current_count INTEGER;
BEGIN
  -- Get user type
  SELECT user_type INTO user_account_type
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- If user is a dealer, check subscription and limits
  IF user_account_type = 'dealer' THEN
    -- Check dealer subscription status and limits
    SELECT 
      subscription_status,
      monthly_listing_limit,
      current_month_listings_count
    INTO 
      dealer_subscription_status,
      dealer_monthly_limit,
      dealer_current_count
    FROM dealers
    WHERE user_id = NEW.user_id;

    -- Check if subscription is active
    IF dealer_subscription_status NOT IN ('active', 'trialing') THEN
      RAISE EXCEPTION 'Dealer subscription is not active. Please renew your subscription.';
    END IF;

    -- Check monthly limit (NULL means unlimited)
    IF dealer_monthly_limit IS NOT NULL THEN
      IF dealer_current_count >= dealer_monthly_limit THEN
        RAISE EXCEPTION 'Monthly listing limit reached. Please upgrade your plan or wait for next month.';
      END IF;

      -- Increment current month counter
      UPDATE dealers
      SET current_month_listings_count = current_month_listings_count + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;

    -- Set listing as dealer listing
    NEW.created_by_type := 'dealer';
    NEW.dealer_id := (SELECT dealer_id FROM dealers WHERE user_id = NEW.user_id);
  ELSE
    -- Individual user - NO LIMITS (each listing = $5 revenue)
    NEW.created_by_type := 'individual';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS enforce_listing_limit ON listings;
CREATE TRIGGER enforce_listing_limit
  BEFORE INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION check_individual_listing_limit();

-- ============================================================
-- 6. Function to reset dealer monthly counters (cron job)
-- ============================================================

CREATE OR REPLACE FUNCTION reset_dealer_monthly_counters()
RETURNS void AS $$
BEGIN
  -- Reset counter for all dealers on the 1st of each month
  UPDATE dealers
  SET current_month_listings_count = 0,
      updated_at = NOW()
  WHERE subscription_status IN ('active', 'trialing');
  
  RAISE NOTICE 'Reset monthly listing counters for all active dealers';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_dealer_monthly_counters IS 'Reset monthly listing counters for dealers. Should be run via cron on 1st of each month';

-- ============================================================
-- 7. Function to check and update expired subscriptions
-- ============================================================

CREATE OR REPLACE FUNCTION update_expired_dealer_subscriptions()
RETURNS void AS $$
BEGIN
  -- Mark expired subscriptions
  UPDATE dealers
  SET subscription_status = 'unpaid',
      updated_at = NOW()
  WHERE subscription_status = 'active'
    AND subscription_end_date < NOW();
  
  -- Deactivate listings for dealers with unpaid subscriptions
  UPDATE listings
  SET is_active = false
  WHERE dealer_id IN (
    SELECT dealer_id FROM dealers WHERE subscription_status = 'unpaid'
  ) AND is_active = true;
  
  RAISE NOTICE 'Updated expired dealer subscriptions';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_expired_dealer_subscriptions IS 'Check and update expired dealer subscriptions. Should be run daily via cron';

-- ============================================================
-- 8. Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on dealers table
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

-- Dealers can view their own data
CREATE POLICY "Dealers can view own data"
  ON dealers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Dealers can update their own data
CREATE POLICY "Dealers can update own data"
  ON dealers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can view verified dealers (for public listings)
CREATE POLICY "Anyone can view verified dealers"
  ON dealers FOR SELECT
  TO public
  USING (verified = true);

-- Enable RLS on dealer_subscriptions
ALTER TABLE dealer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Dealers can view their own subscription history
CREATE POLICY "Dealers can view own subscriptions"
  ON dealer_subscriptions FOR SELECT
  TO authenticated
  USING (dealer_id IN (SELECT dealer_id FROM dealers WHERE user_id = auth.uid()));

-- ============================================================
-- 9. Subscription Tier Pricing (reference data)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  tier_id TEXT PRIMARY KEY,
  tier_name TEXT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  listing_limit INTEGER, -- NULL = unlimited
  features JSONB,
  stripe_price_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO subscription_tiers (tier_id, tier_name, monthly_price, listing_limit, features, stripe_price_id) VALUES
  ('tier_100', 'Up to 100 listings', 400.00, 100, '{"verified_badge": true, "priority_support": false, "analytics": false}', NULL),
  ('tier_250', 'Up to 250 listings', 800.00, 250, '{"verified_badge": true, "priority_support": true, "analytics": true}', NULL),
  ('tier_500', 'Up to 500 listings', 1250.00, 500, '{"verified_badge": true, "priority_support": true, "analytics": true, "featured_listings": 10}', NULL),
  ('tier_1000', 'Up to 1000 listings', 2000.00, 1000, '{"verified_badge": true, "priority_support": true, "analytics": true, "featured_listings": 20}', NULL),
  ('tier_unlimited', 'Unlimited listings', 3000.00, NULL, '{"verified_badge": true, "priority_support": true, "analytics": true, "featured_listings": "unlimited", "api_access": true}', NULL)
ON CONFLICT (tier_id) DO NOTHING;

COMMENT ON TABLE subscription_tiers IS 'Available subscription tiers for dealers';

-- ============================================================
-- 10. Helper function to check if user can create listing
-- ============================================================

CREATE OR REPLACE FUNCTION can_user_create_listing(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_account_type TEXT;
  dealer_info RECORD;
BEGIN
  -- Get user type
  SELECT user_type INTO user_account_type
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF user_account_type = 'dealer' THEN
    -- Check dealer subscription and limits
    SELECT * INTO dealer_info
    FROM dealers
    WHERE user_id = p_user_id;

    IF dealer_info IS NULL THEN
      result := jsonb_build_object(
        'can_create', false,
        'reason', 'Dealer account not found',
        'user_type', 'dealer'
      );
    ELSIF dealer_info.subscription_status NOT IN ('active', 'trialing') THEN
      result := jsonb_build_object(
        'can_create', false,
        'reason', 'Subscription is not active',
        'user_type', 'dealer',
        'subscription_status', dealer_info.subscription_status
      );
    ELSIF dealer_info.monthly_listing_limit IS NOT NULL 
      AND dealer_info.current_month_listings_count >= dealer_info.monthly_listing_limit THEN
      result := jsonb_build_object(
        'can_create', false,
        'reason', 'Monthly listing limit reached',
        'user_type', 'dealer',
        'limit', dealer_info.monthly_listing_limit,
        'current_count', dealer_info.current_month_listings_count
      );
    ELSE
      result := jsonb_build_object(
        'can_create', true,
        'user_type', 'dealer',
        'subscription_tier', dealer_info.subscription_tier,
        'remaining_listings', CASE 
          WHEN dealer_info.monthly_listing_limit IS NULL THEN 'unlimited'
          ELSE (dealer_info.monthly_listing_limit - dealer_info.current_month_listings_count)::TEXT
        END
      );
    END IF;
  ELSE
    -- Individual user - can always create (will pay $5)
    result := jsonb_build_object(
      'can_create', true,
      'user_type', 'individual',
      'payment_required', true,
      'payment_amount', 5.00
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_user_create_listing IS 'Check if user can create a listing and return details';

-- ============================================================
-- DONE! Migration complete
-- ============================================================

-- Summary of what was added:
-- ✅ user_type column in profiles (individual/dealer)
-- ✅ dealers table with subscription management
-- ✅ dealer_subscriptions table for history
-- ✅ dealer_id reference in listings
-- ✅ Updated trigger to check dealer limits
-- ✅ Helper functions for subscription management
-- ✅ RLS policies for security
-- ✅ Subscription tiers reference data
-- ✅ Helper function to check listing permissions
