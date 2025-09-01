-- Fix registration RLS policies
-- The issue is likely conflicting SELECT policies affecting INSERT operations

-- First, let's see the current policies (for reference)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- Drop the restrictive "Users can view own profile" policy since we already have
-- "Allow anonymous read contact info" that handles SELECT operations
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Ensure the INSERT policy allows new user registration
-- The existing "Users can insert own profile" should work, but let's recreate it to be sure
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Also ensure UPDATE policy exists and works
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify the final policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;
