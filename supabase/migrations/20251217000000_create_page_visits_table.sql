-- Migration: Create page visits analytics table
-- Created: 2025-12-17
-- Purpose: Track page visits for analytics (non-bot traffic only)

-- ============================================
-- Create page_visits table
-- ============================================
CREATE TABLE IF NOT EXISTS page_visits (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  ip_hash TEXT NOT NULL, -- Hashed IP for privacy
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_path ON page_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_page_visits_ip_hash ON page_visits(ip_hash);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Only authenticated admin users can view analytics
CREATE POLICY "Allow admins to view page visits" ON page_visits
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND email = 'admin@carlynx.us'
    )
  );

-- Allow anonymous inserts (middleware will insert)
CREATE POLICY "Allow anonymous inserts" ON page_visits
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Create auto-cleanup cron job (delete old records)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Delete records older than 90 days (Daily at 4 AM)
SELECT cron.schedule(
  'cleanup-old-page-visits-90d',
  '0 4 * * *', -- Daily at 4:00 AM
  $$
    DELETE FROM page_visits
    WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);

-- ============================================
-- Create materialized view for daily stats
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS page_visits_daily_stats AS
SELECT
  DATE(created_at) as visit_date,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(*) as total_visits,
  page_path,
  COUNT(DISTINCT ip_hash) as unique_ips
FROM page_visits
GROUP BY DATE(created_at), page_path
ORDER BY visit_date DESC, total_visits DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_page_visits_daily_stats_date 
ON page_visits_daily_stats(visit_date DESC);
