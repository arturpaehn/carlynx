-- ============================================================
-- Migration: Auto-create dealer record when user registers as dealer
-- FOR PRODUCTION DATABASE
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

-- Verify trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
AND trigger_name = 'create_dealer_trigger';
