-- ============================================
-- Improve Price Badge Matching - Fuzzy Search
-- ============================================
-- Problem: Exact model match fails when listing has trim/variant
-- Example: "Shadow Phantom ABS" vs "Shadow Phantom" in database
-- Solution: Try exact match first, then fuzzy match

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
  -- Try exact match first (case-insensitive)
  SELECT avg_price INTO v_avg_price
  FROM vehicle_price_benchmarks
  WHERE LOWER(brand) = LOWER(p_brand)
    AND LOWER(model) = LOWER(p_model)
    AND year = p_year
  LIMIT 1;
  
  -- If no exact match, try partial match (model starts with benchmark model)
  -- Example: "Shadow Phantom ABS" matches "Shadow Phantom"
  IF v_avg_price IS NULL THEN
    SELECT avg_price INTO v_avg_price
    FROM vehicle_price_benchmarks
    WHERE LOWER(brand) = LOWER(p_brand)
      AND year = p_year
      AND LOWER(p_model) LIKE LOWER(model) || '%'
    ORDER BY LENGTH(model) DESC -- Prefer longer matches (more specific)
    LIMIT 1;
  END IF;
  
  -- If still no match, try reverse: benchmark model contains listing model
  -- Example: "F-150" in listing matches "F-150 SuperCrew" in database
  IF v_avg_price IS NULL THEN
    SELECT avg_price INTO v_avg_price
    FROM vehicle_price_benchmarks
    WHERE LOWER(brand) = LOWER(p_brand)
      AND year = p_year
      AND LOWER(model) LIKE '%' || LOWER(p_model) || '%'
    ORDER BY LENGTH(model) ASC -- Prefer shorter matches (less specific)
    LIMIT 1;
  END IF;
  
  -- If no benchmark data found, return null
  IF v_avg_price IS NULL OR v_avg_price = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Calculate price ratio (listing price / average price)
  v_price_ratio := (p_price / v_avg_price) * 100;
  
  -- Determine badge
  -- Good: < 80% of average (low price)
  -- Fair: 80-120% of average (normal price)
  -- High: > 120% of average (high price)
  
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
  'Returns price badge (good/fair/high) by comparing listing price with market average. 
   Uses fuzzy matching: exact match → starts with → contains. 
   Good: <80%, Fair: 80-120%, High: >120%';
