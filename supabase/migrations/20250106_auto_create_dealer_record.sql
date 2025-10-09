-- ============================================================
-- Migration: Auto-create dealer record when user registers as dealer
-- Date: 2025-01-06
-- ============================================================

-- Function to create dealer record automatically
CREATE OR REPLACE FUNCTION create_dealer_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_type is 'dealer', create a dealer record
  IF NEW.user_type = 'dealer' THEN
    INSERT INTO dealers (
      dealer_id,
      user_id,
      company_name,
      subscription_tier,
      subscription_status,
      trial_end_date,
      current_tier_id,
      verified,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.user_id,
      COALESCE(NEW.name, 'Company') || '''s Company', -- Use user's name + 's Company
      'enterprise', -- Will be updated when they subscribe
      'trialing', -- Start with trial status
      NOW() + INTERVAL '7 days', -- 7 day trial period
      NULL, -- No tier assigned during trial
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING; -- Skip if already exists
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_profiles
DROP TRIGGER IF EXISTS create_dealer_trigger ON user_profiles;
CREATE TRIGGER create_dealer_trigger
  AFTER INSERT OR UPDATE OF user_type ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_dealer_on_registration();

-- Also create dealer record for existing dealer users who don't have one
INSERT INTO dealers (
  dealer_id,
  user_id,
  company_name,
  subscription_tier,
  subscription_status,
  trial_end_date,
  current_tier_id,
  verified,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  user_id,
  COALESCE(name, 'Company') || '''s Company',
  'basic',
  'trialing',
  NOW() + INTERVAL '7 days',
  NULL,
  false,
  NOW(),
  NOW()
FROM user_profiles
WHERE user_type = 'dealer'
AND user_id NOT IN (SELECT user_id FROM dealers)
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT 
  up.user_id,
  up.name,
  up.user_type,
  d.dealer_id,
  d.company_name,
  d.subscription_status,
  d.trial_end_date
FROM user_profiles up
LEFT JOIN dealers d ON up.user_id = d.user_id
WHERE up.user_type = 'dealer';
