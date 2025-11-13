-- ============================================
-- Create Vehicle Price Benchmarks Table
-- ============================================
-- This table stores average vehicle prices for Texas market
-- Used to display "Good/Fair/High" price badges on listings
-- Data is public (visible to all users, registered or not)

-- Create the table
CREATE TABLE IF NOT EXISTS vehicle_price_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehicle identification
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1980 AND year <= 2030),
  
  -- Price statistics (in USD)
  avg_price NUMERIC(10,2) NOT NULL CHECK (avg_price > 0),
  min_price NUMERIC(10,2) CHECK (min_price >= 0),
  max_price NUMERIC(10,2) CHECK (max_price >= avg_price),
  
  -- Data quality
  sample_count INTEGER DEFAULT 0 CHECK (sample_count >= 0),
  
  -- Metadata
  state_code TEXT DEFAULT 'TX',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of brand, model, year
  UNIQUE(brand, model, year)
);

-- Create indexes for fast lookups
CREATE INDEX idx_benchmarks_brand_model_year 
  ON vehicle_price_benchmarks(brand, model, year);

CREATE INDEX idx_benchmarks_brand 
  ON vehicle_price_benchmarks(brand);

CREATE INDEX idx_benchmarks_year 
  ON vehicle_price_benchmarks(year);

-- Add comments
COMMENT ON TABLE vehicle_price_benchmarks IS 
  'Average vehicle prices for Texas market. Used for price comparison badges (Good/Fair/High).';

COMMENT ON COLUMN vehicle_price_benchmarks.brand IS 
  'Vehicle brand/make (e.g., Toyota, Ford, Honda)';

COMMENT ON COLUMN vehicle_price_benchmarks.model IS 
  'Vehicle model (e.g., Camry, F-150, Civic)';

COMMENT ON COLUMN vehicle_price_benchmarks.year IS 
  'Model year (1980-2030)';

COMMENT ON COLUMN vehicle_price_benchmarks.avg_price IS 
  'Average market price in USD for this brand/model/year in Texas';

COMMENT ON COLUMN vehicle_price_benchmarks.sample_count IS 
  'Number of listings used to calculate the average (for data quality assessment)';

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE vehicle_price_benchmarks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all users (authenticated and anonymous) to read
CREATE POLICY "Allow public read access to price benchmarks"
  ON vehicle_price_benchmarks
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: Only service role can insert/update/delete (admin only)
-- This means data can only be modified via migrations or admin scripts
CREATE POLICY "Only service role can modify price benchmarks"
  ON vehicle_price_benchmarks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Helper Function: Get Price Badge
-- ============================================

CREATE OR REPLACE FUNCTION get_price_badge(
  p_brand TEXT,
  p_model TEXT,
  p_year INTEGER,
  p_price NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_avg_price NUMERIC;
  v_price_ratio NUMERIC;
BEGIN
  -- Get average price for this vehicle
  SELECT avg_price INTO v_avg_price
  FROM vehicle_price_benchmarks
  WHERE LOWER(brand) = LOWER(p_brand)
    AND LOWER(model) = LOWER(p_model)
    AND year = p_year
  LIMIT 1;
  
  -- If no benchmark data, return null
  IF v_avg_price IS NULL OR v_avg_price = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Calculate price ratio (listing price / average price)
  v_price_ratio := (p_price / v_avg_price) * 100;
  
  -- Determine badge
  -- Good: < 80% of average (низкая цена)
  -- Fair: 80-120% of average (нормальная цена)
  -- High: > 120% of average (высокая цена)
  
  IF v_price_ratio < 80 THEN
    RETURN 'good';
  ELSIF v_price_ratio <= 120 THEN
    RETURN 'fair';
  ELSE
    RETURN 'high';
  END IF;
END;
$$;

COMMENT ON FUNCTION get_price_badge IS 
  'Returns price badge (good/fair/high) by comparing listing price with market average. Good: <80%, Fair: 80-120%, High: >120%';

-- ============================================
-- Migration Complete
-- ============================================
-- Next steps:
-- 1. Run generate_price_data_template.sql to create data insertion template
-- 2. Use ChatGPT to populate with real Texas market prices
-- 3. Insert data using the generated SQL script
