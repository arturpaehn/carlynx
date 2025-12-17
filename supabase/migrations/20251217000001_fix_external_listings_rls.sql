-- Migration: Fix RLS policies for external_listings table to show all records to admin
-- Created: 2025-12-17
-- Purpose: Allow admin users to see all external listings regardless of RLS restrictions

-- Check if RLS is enabled on external_listings
-- ALTER TABLE external_listings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows admins to see all records
CREATE POLICY "Admin can view all external listings" ON external_listings
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND email = 'admin@carlynx.us'
    )
  );

-- Keep existing public read policy for non-authenticated users
-- (this should remain unchanged)
