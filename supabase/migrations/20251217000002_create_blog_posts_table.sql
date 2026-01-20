-- Migration: Create blog_posts table for SEO blog
-- Created: 2025-12-17
-- Purpose: Store blog articles for organic SEO traffic

-- ============================================
-- Create blog_posts table
-- ============================================
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

-- ============================================
-- Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Public can read published posts
CREATE POLICY "Anyone can read published posts" ON blog_posts
  FOR SELECT
  USING (is_published = true);

-- Only authenticated admin can create/update/delete
CREATE POLICY "Admin can manage all posts" ON blog_posts
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND email = 'admin@carlynx.us'
    )
  );

-- ============================================
-- Add comments for documentation
-- ============================================
COMMENT ON TABLE blog_posts IS 'Blog articles for SEO and organic traffic generation';
COMMENT ON COLUMN blog_posts.slug IS 'URL-friendly identifier (e.g., how-to-buy-used-car)';
COMMENT ON COLUMN blog_posts.title IS 'Article title - appears in search results';
COMMENT ON COLUMN blog_posts.excerpt IS 'Short summary for blog preview cards';
COMMENT ON COLUMN blog_posts.content IS 'Full article content in HTML format';
COMMENT ON COLUMN blog_posts.featured_image_url IS 'URL to featured image for preview';
COMMENT ON COLUMN blog_posts.category IS 'Article category for filtering and organization';
COMMENT ON COLUMN blog_posts.tags IS 'Array of topic tags for categorization';
COMMENT ON COLUMN blog_posts.seo_keywords IS 'Array of target keywords for SEO optimization';
COMMENT ON COLUMN blog_posts.internal_links IS 'Array of internal site paths to link/promote';
COMMENT ON COLUMN blog_posts.is_published IS 'Whether article is visible to public';
COMMENT ON COLUMN blog_posts.view_count IS 'Number of times article has been viewed';
