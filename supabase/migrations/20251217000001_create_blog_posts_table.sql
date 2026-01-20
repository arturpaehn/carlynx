-- Migration: Create blog_posts table
-- Created: 2025-12-17
-- Purpose: Store SEO blog articles for organic traffic

CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author TEXT DEFAULT 'CarLynx Team',
  category TEXT, -- 'buying-guide', 'selling-guide', 'vin-check', 'local-houston', 'local-dallas', 'local-austin', 'local-katy', 'finance', 'maintenance'
  tags TEXT[], -- Array of tags
  seo_keywords TEXT[], -- Array of target keywords
  internal_links TEXT[], -- Array of internal link paths
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT false,
  view_count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Anyone can read published posts" ON blog_posts
  FOR SELECT
  USING (is_published = true);

-- Only admin can create/update
CREATE POLICY "Admin can manage posts" ON blog_posts
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND email = 'admin@carlynx.us'
    )
  );

-- Add comment
COMMENT ON TABLE blog_posts IS 'Blog articles for SEO and organic traffic';
COMMENT ON COLUMN blog_posts.slug IS 'URL-friendly identifier (e.g., how-to-buy-used-car)';
COMMENT ON COLUMN blog_posts.seo_keywords IS 'Target keywords for this article';
COMMENT ON COLUMN blog_posts.internal_links IS 'Paths to internal pages to link to (/search-results, /listing/[id], etc.)';
