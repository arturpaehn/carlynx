-- Migration: Add payment system for individual users
-- Created: 2025-01-02
-- Description: Adds payment tracking for listings and prepares for Stripe integration

-- 1. Add payment-related columns to listings table
ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_id UUID,
  ADD COLUMN IF NOT EXISTS created_by_type TEXT DEFAULT 'individual';

-- Add comments
COMMENT ON COLUMN listings.payment_status IS 'Payment status: unpaid, free_trial, pending, paid, refunded';
COMMENT ON COLUMN listings.payment_id IS 'Reference to individual_payments.payment_id (UUID)';
COMMENT ON COLUMN listings.created_by_type IS 'Creator type: individual or dealer';

-- 2. Create individual_payments table
CREATE TABLE IF NOT EXISTS individual_payments (
  payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  currency TEXT DEFAULT 'USD',
  
  -- Stripe fields (NULL during free trial)
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_session_id TEXT,
  
  -- Status
  payment_status TEXT NOT NULL DEFAULT 'free_trial',
  payment_method TEXT DEFAULT 'free_trial',
  
  -- Dates
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP DEFAULT NOW(),
  refunded_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB,
  
  CONSTRAINT individual_payments_payment_status_check 
    CHECK (payment_status IN ('free_trial', 'pending', 'processing', 'succeeded', 'failed', 'refunded')),
  CONSTRAINT individual_payments_payment_method_check 
    CHECK (payment_method IN ('free_trial', 'card', 'bank_transfer', 'paypal'))
);

-- Add comments
COMMENT ON TABLE individual_payments IS 'Payment records for individual user listings';
COMMENT ON COLUMN individual_payments.payment_status IS 'free_trial: Free during trial period, succeeded: Payment completed';
COMMENT ON COLUMN individual_payments.metadata IS 'Additional payment metadata (listing title, trial info, etc.)';

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_payment_status ON listings(payment_status);
CREATE INDEX IF NOT EXISTS idx_listings_created_by_type ON listings(created_by_type);
CREATE INDEX IF NOT EXISTS idx_listings_payment_id ON listings(payment_id);
CREATE INDEX IF NOT EXISTS idx_individual_payments_user_id ON individual_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_individual_payments_listing_id ON individual_payments(listing_id);
CREATE INDEX IF NOT EXISTS idx_individual_payments_status ON individual_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_individual_payments_stripe_payment_intent ON individual_payments(stripe_payment_intent_id);

-- 4. Function to check individual listing limit
CREATE OR REPLACE FUNCTION check_individual_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_active_listings INT;
BEGIN
  -- For individual users, check limit (dealers table doesn't exist yet, so skip dealer check)
  IF NEW.created_by_type = 'individual' OR NEW.created_by_type IS NULL THEN
    -- Count active PAID or FREE_TRIAL listings
    SELECT COUNT(*) INTO user_active_listings
    FROM listings
    WHERE user_id = NEW.user_id 
      AND is_active = true 
      AND payment_status IN ('paid', 'free_trial');
    
    IF user_active_listings >= 1 THEN
      RAISE EXCEPTION 'You already have an active listing. Individual users can only have 1 active listing at a time. Please deactivate your current listing before creating a new one.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
DROP TRIGGER IF EXISTS enforce_individual_listing_limit ON listings;
CREATE TRIGGER enforce_individual_listing_limit
  BEFORE INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION check_individual_listing_limit();

-- 6. Function to auto-expire free trial listings after 30 days
CREATE OR REPLACE FUNCTION expire_trial_listings()
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET is_active = false
  WHERE payment_status = 'free_trial'
    AND created_at < NOW() - INTERVAL '30 days'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 7. Enable Row Level Security
ALTER TABLE individual_payments ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for individual_payments
CREATE POLICY "Users can view their own payments"
  ON individual_payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON individual_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 9. Grant permissions
GRANT SELECT, INSERT ON individual_payments TO authenticated;

-- 10. Create view for user payment history
CREATE OR REPLACE VIEW user_payment_history AS
SELECT 
  p.payment_id,
  p.user_id,
  p.listing_id,
  p.amount,
  p.currency,
  p.payment_status,
  p.payment_method,
  p.created_at,
  p.paid_at,
  l.title as listing_title,
  l.price as listing_price,
  l.is_active as listing_is_active
FROM individual_payments p
LEFT JOIN listings l ON p.listing_id = l.id;

GRANT SELECT ON user_payment_history TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Payment system migration completed successfully!';
  RAISE NOTICE 'Added: payment_status, payment_id, created_by_type to listings';
  RAISE NOTICE 'Created: individual_payments table with Stripe integration ready';
  RAISE NOTICE 'Created: Indexes, triggers, RLS policies';
  RAISE NOTICE 'Ready for: Free trial listings and future Stripe integration';
END $$;
