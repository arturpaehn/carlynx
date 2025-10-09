-- Migration: Add subscription fields to dealers table
-- Description: Add columns needed for Stripe subscription management
-- Date: 2025-01-03

-- Add subscription-related columns to dealers table
ALTER TABLE dealers 
  ADD COLUMN IF NOT EXISTS current_tier_id TEXT REFERENCES subscription_tiers(tier_id),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN dealers.current_tier_id IS 'Reference to subscription_tiers table';
COMMENT ON COLUMN dealers.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN dealers.stripe_subscription_id IS 'Stripe Subscription ID (sub_xxx)';
COMMENT ON COLUMN dealers.subscription_start_date IS 'Current billing period start date';
COMMENT ON COLUMN dealers.subscription_end_date IS 'Current billing period end date';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dealers_stripe_customer ON dealers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_dealers_stripe_subscription ON dealers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_dealers_tier ON dealers(current_tier_id);
CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(subscription_status);

-- Verify columns exist
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'dealers'
    AND column_name IN ('current_tier_id', 'stripe_customer_id', 'stripe_subscription_id', 
                        'subscription_start_date', 'subscription_end_date');
  
  IF col_count = 5 THEN
    RAISE NOTICE '✅ All 5 subscription columns added successfully!';
  ELSE
    RAISE WARNING '⚠️ Only % of 5 columns found. Check migration.', col_count;
  END IF;
END $$;

-- Show current dealers table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dealers'
ORDER BY ordinal_position;
