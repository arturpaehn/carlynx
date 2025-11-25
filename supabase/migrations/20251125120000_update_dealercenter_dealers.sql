-- ============================================
-- Update DealerCenter Dealers Table
-- ============================================
-- Add fields for AccountID, DCID tracking and email status

-- Add new columns for dealer identification from feed
ALTER TABLE dealercenter_dealers 
ADD COLUMN IF NOT EXISTS dealercenter_account_id text,
ADD COLUMN IF NOT EXISTS dcid text,
ADD COLUMN IF NOT EXISTS welcome_email_sent boolean DEFAULT false;

-- Create indexes for fast lookups by AccountID and DCID
CREATE INDEX IF NOT EXISTS idx_dealercenter_account_id ON dealercenter_dealers(dealercenter_account_id);
CREATE INDEX IF NOT EXISTS idx_dealercenter_dcid ON dealercenter_dealers(dcid);

-- Add unique constraint: each AccountID should be unique
CREATE UNIQUE INDEX IF NOT EXISTS unique_dealercenter_account_id 
  ON dealercenter_dealers(dealercenter_account_id) 
  WHERE dealercenter_account_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN dealercenter_dealers.dealercenter_account_id IS 'AccountID from DealerCenter feed - unique dealer identifier';
COMMENT ON COLUMN dealercenter_dealers.dcid IS 'DCID from DealerCenter feed - alternative dealer identifier';
COMMENT ON COLUMN dealercenter_dealers.welcome_email_sent IS 'Track if welcome/activation email was sent to dealer';

-- ============================================
-- Migration Complete
-- ============================================
