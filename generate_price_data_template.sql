-- ============================================
-- Price Data Template Generator
-- ============================================
-- This script generates a template for popular vehicle models in Texas (1980-2025)
-- Copy the INSERT statements and ask ChatGPT to fill in realistic average prices
-- based on Texas market data from sources like KBB, NADA, Edmunds, or Cars.com

-- ============================================
-- INSTRUCTIONS FOR USE:
-- ============================================
-- 1. Copy all INSERT statements below
-- 2. Ask ChatGPT/Claude: "Fill in realistic average prices (avg_price) for these 
--    vehicles in Texas market based on their year. Use actual market data from 
--    2024-2025. Keep the INSERT format. For older years (1980s-1990s), use 
--    depreciated values. For recent years, use current market prices."
-- 3. Run the filled SQL in Supabase SQL Editor
-- 4. Verify with: SELECT COUNT(*) FROM vehicle_price_benchmarks;

-- ============================================
-- TOP POPULAR BRANDS IN TEXAS
-- ============================================
-- Based on Texas sales data 2024:
-- 1. Ford (F-150 dominance)
-- 2. Chevrolet 
-- 3. RAM
-- 4. Toyota
-- 5. GMC
-- 6. Honda
-- 7. Nissan
-- 8. Jeep
-- 9. Dodge
-- 10. Hyundai
-- 11. Kia
-- 12. Subaru
-- 13. Mazda
-- 14. Volkswagen
-- 15. Tesla

-- ============================================
-- FORD MODELS (Most popular in Texas)
-- ============================================

-- Ford F-150 (1980-2025) - Best selling vehicle in Texas
-- Prompt: "Fill avg_price for Ford F-150 by year (1980-2025) Texas market"
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Ford', 'F-150', 1980, 5000, 3000, 8000, 0),
('Ford', 'F-150', 1985, 6000, 4000, 9000, 0),
('Ford', 'F-150', 1990, 7000, 5000, 11000, 0),
('Ford', 'F-150', 1995, 8500, 6000, 13000, 0),
('Ford', 'F-150', 2000, 12000, 8000, 18000, 0),
('Ford', 'F-150', 2005, 15000, 10000, 22000, 0),
('Ford', 'F-150', 2010, 20000, 14000, 28000, 0),
('Ford', 'F-150', 2015, 32000, 25000, 42000, 0),
('Ford', 'F-150', 2018, 38000, 30000, 48000, 0),
('Ford', 'F-150', 2020, 45000, 38000, 55000, 0),
('Ford', 'F-150', 2021, 50000, 42000, 62000, 0),
('Ford', 'F-150', 2022, 55000, 48000, 68000, 0),
('Ford', 'F-150', 2023, 58000, 50000, 72000, 0),
('Ford', 'F-150', 2024, 60000, 52000, 75000, 0),
('Ford', 'F-150', 2025, 62000, 54000, 78000, 0);

-- Ford Mustang
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Ford', 'Mustang', 1990, 8000, 5000, 12000, 0),
('Ford', 'Mustang', 1995, 10000, 7000, 15000, 0),
('Ford', 'Mustang', 2000, 12000, 8000, 18000, 0),
('Ford', 'Mustang', 2005, 15000, 10000, 22000, 0),
('Ford', 'Mustang', 2010, 18000, 13000, 26000, 0),
('Ford', 'Mustang', 2015, 25000, 20000, 35000, 0),
('Ford', 'Mustang', 2018, 30000, 24000, 40000, 0),
('Ford', 'Mustang', 2020, 35000, 28000, 45000, 0),
('Ford', 'Mustang', 2022, 40000, 32000, 52000, 0),
('Ford', 'Mustang', 2024, 45000, 36000, 58000, 0);

-- Ford Explorer
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Ford', 'Explorer', 2000, 8000, 5000, 12000, 0),
('Ford', 'Explorer', 2005, 11000, 7000, 16000, 0),
('Ford', 'Explorer', 2010, 15000, 10000, 22000, 0),
('Ford', 'Explorer', 2015, 22000, 17000, 30000, 0),
('Ford', 'Explorer', 2018, 28000, 22000, 36000, 0),
('Ford', 'Explorer', 2020, 35000, 28000, 44000, 0),
('Ford', 'Explorer', 2022, 42000, 34000, 52000, 0),
('Ford', 'Explorer', 2024, 48000, 40000, 58000, 0);

-- ============================================
-- CHEVROLET MODELS
-- ============================================

-- Chevrolet Silverado (Top seller)
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Chevrolet', 'Silverado', 1990, 7000, 4500, 11000, 0),
('Chevrolet', 'Silverado', 1995, 9000, 6000, 13000, 0),
('Chevrolet', 'Silverado', 2000, 12000, 8000, 17000, 0),
('Chevrolet', 'Silverado', 2005, 16000, 11000, 23000, 0),
('Chevrolet', 'Silverado', 2010, 22000, 16000, 30000, 0),
('Chevrolet', 'Silverado', 2015, 32000, 26000, 42000, 0),
('Chevrolet', 'Silverado', 2018, 38000, 32000, 48000, 0),
('Chevrolet', 'Silverado', 2020, 45000, 38000, 56000, 0),
('Chevrolet', 'Silverado', 2022, 52000, 44000, 64000, 0),
('Chevrolet', 'Silverado', 2024, 58000, 50000, 70000, 0);

-- Chevrolet Tahoe
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Chevrolet', 'Tahoe', 2000, 10000, 6500, 15000, 0),
('Chevrolet', 'Tahoe', 2005, 14000, 9000, 20000, 0),
('Chevrolet', 'Tahoe', 2010, 20000, 14000, 28000, 0),
('Chevrolet', 'Tahoe', 2015, 32000, 25000, 42000, 0),
('Chevrolet', 'Tahoe', 2018, 42000, 34000, 52000, 0),
('Chevrolet', 'Tahoe', 2020, 52000, 44000, 64000, 0),
('Chevrolet', 'Tahoe', 2022, 62000, 52000, 76000, 0),
('Chevrolet', 'Tahoe', 2024, 70000, 60000, 85000, 0);

-- Chevrolet Camaro
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Chevrolet', 'Camaro', 1990, 7000, 4500, 11000, 0),
('Chevrolet', 'Camaro', 1995, 9000, 6000, 13000, 0),
('Chevrolet', 'Camaro', 2000, 11000, 7500, 16000, 0),
('Chevrolet', 'Camaro', 2010, 18000, 13000, 25000, 0),
('Chevrolet', 'Camaro', 2015, 24000, 19000, 32000, 0),
('Chevrolet', 'Camaro', 2018, 28000, 22000, 36000, 0),
('Chevrolet', 'Camaro', 2020, 32000, 26000, 42000, 0),
('Chevrolet', 'Camaro', 2022, 36000, 29000, 46000, 0),
('Chevrolet', 'Camaro', 2024, 40000, 32000, 52000, 0);

-- ============================================
-- RAM MODELS
-- ============================================

-- RAM 1500
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('RAM', '1500', 2010, 20000, 14000, 28000, 0),
('RAM', '1500', 2015, 30000, 24000, 40000, 0),
('RAM', '1500', 2018, 36000, 30000, 46000, 0),
('RAM', '1500', 2020, 42000, 35000, 52000, 0),
('RAM', '1500', 2022, 50000, 42000, 62000, 0),
('RAM', '1500', 2024, 56000, 48000, 68000, 0);

-- RAM 2500
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('RAM', '2500', 2010, 25000, 18000, 34000, 0),
('RAM', '2500', 2015, 35000, 28000, 46000, 0),
('RAM', '2500', 2018, 42000, 35000, 52000, 0),
('RAM', '2500', 2020, 50000, 42000, 62000, 0),
('RAM', '2500', 2022, 60000, 50000, 74000, 0),
('RAM', '2500', 2024, 68000, 58000, 82000, 0);

-- ============================================
-- TOYOTA MODELS
-- ============================================

-- Toyota Camry (Popular sedan)
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Toyota', 'Camry', 1990, 5000, 3000, 8000, 0),
('Toyota', 'Camry', 1995, 6500, 4000, 10000, 0),
('Toyota', 'Camry', 2000, 8000, 5500, 12000, 0),
('Toyota', 'Camry', 2005, 10000, 7000, 15000, 0),
('Toyota', 'Camry', 2010, 13000, 9000, 18000, 0),
('Toyota', 'Camry', 2015, 18000, 14000, 24000, 0),
('Toyota', 'Camry', 2018, 22000, 18000, 28000, 0),
('Toyota', 'Camry', 2020, 25000, 21000, 32000, 0),
('Toyota', 'Camry', 2022, 28000, 24000, 36000, 0),
('Toyota', 'Camry', 2024, 32000, 27000, 40000, 0);

-- Toyota Corolla
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Toyota', 'Corolla', 1990, 4000, 2500, 6500, 0),
('Toyota', 'Corolla', 1995, 5000, 3500, 8000, 0),
('Toyota', 'Corolla', 2000, 6500, 4500, 10000, 0),
('Toyota', 'Corolla', 2005, 8500, 6000, 12500, 0),
('Toyota', 'Corolla', 2010, 11000, 8000, 15000, 0),
('Toyota', 'Corolla', 2015, 15000, 12000, 20000, 0),
('Toyota', 'Corolla', 2018, 18000, 15000, 24000, 0),
('Toyota', 'Corolla', 2020, 21000, 17000, 27000, 0),
('Toyota', 'Corolla', 2022, 24000, 20000, 30000, 0),
('Toyota', 'Corolla', 2024, 26000, 22000, 33000, 0);

-- Toyota Tacoma (Popular truck)
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Toyota', 'Tacoma', 2000, 10000, 7000, 15000, 0),
('Toyota', 'Tacoma', 2005, 14000, 10000, 20000, 0),
('Toyota', 'Tacoma', 2010, 20000, 15000, 27000, 0),
('Toyota', 'Tacoma', 2015, 28000, 22000, 36000, 0),
('Toyota', 'Tacoma', 2018, 32000, 26000, 40000, 0),
('Toyota', 'Tacoma', 2020, 36000, 30000, 45000, 0),
('Toyota', 'Tacoma', 2022, 40000, 34000, 50000, 0),
('Toyota', 'Tacoma', 2024, 44000, 37000, 54000, 0);

-- Toyota Tundra
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Toyota', 'Tundra', 2005, 15000, 11000, 22000, 0),
('Toyota', 'Tundra', 2010, 22000, 16000, 30000, 0),
('Toyota', 'Tundra', 2015, 30000, 24000, 40000, 0),
('Toyota', 'Tundra', 2018, 36000, 30000, 46000, 0),
('Toyota', 'Tundra', 2020, 42000, 35000, 52000, 0),
('Toyota', 'Tundra', 2022, 50000, 42000, 62000, 0),
('Toyota', 'Tundra', 2024, 56000, 48000, 68000, 0);

-- Toyota RAV4
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Toyota', 'RAV4', 2000, 7000, 5000, 11000, 0),
('Toyota', 'RAV4', 2005, 10000, 7000, 15000, 0),
('Toyota', 'RAV4', 2010, 14000, 10000, 20000, 0),
('Toyota', 'RAV4', 2015, 20000, 16000, 27000, 0),
('Toyota', 'RAV4', 2018, 25000, 21000, 33000, 0),
('Toyota', 'RAV4', 2020, 30000, 25000, 38000, 0),
('Toyota', 'RAV4', 2022, 34000, 29000, 43000, 0),
('Toyota', 'RAV4', 2024, 38000, 32000, 48000, 0);

-- ============================================
-- HONDA MODELS
-- ============================================

-- Honda Civic
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Honda', 'Civic', 1990, 4000, 2500, 6500, 0),
('Honda', 'Civic', 1995, 5500, 3500, 8500, 0),
('Honda', 'Civic', 2000, 7000, 5000, 11000, 0),
('Honda', 'Civic', 2005, 9000, 6500, 13500, 0),
('Honda', 'Civic', 2010, 12000, 9000, 17000, 0),
('Honda', 'Civic', 2015, 16000, 13000, 22000, 0),
('Honda', 'Civic', 2018, 19000, 16000, 26000, 0),
('Honda', 'Civic', 2020, 22000, 18000, 29000, 0),
('Honda', 'Civic', 2022, 25000, 21000, 32000, 0),
('Honda', 'Civic', 2024, 28000, 24000, 36000, 0);

-- Honda Accord
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Honda', 'Accord', 1990, 4500, 3000, 7000, 0),
('Honda', 'Accord', 1995, 6000, 4000, 9500, 0),
('Honda', 'Accord', 2000, 8000, 5500, 12000, 0),
('Honda', 'Accord', 2005, 10500, 7500, 15500, 0),
('Honda', 'Accord', 2010, 13500, 10000, 19000, 0),
('Honda', 'Accord', 2015, 18000, 14500, 25000, 0),
('Honda', 'Accord', 2018, 22000, 18000, 29000, 0),
('Honda', 'Accord', 2020, 26000, 22000, 34000, 0),
('Honda', 'Accord', 2022, 29000, 25000, 38000, 0),
('Honda', 'Accord', 2024, 33000, 28000, 42000, 0);

-- Honda CR-V
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Honda', 'CR-V', 2000, 7500, 5500, 11500, 0),
('Honda', 'CR-V', 2005, 10000, 7500, 15000, 0),
('Honda', 'CR-V', 2010, 14000, 11000, 20000, 0),
('Honda', 'CR-V', 2015, 20000, 16000, 27000, 0),
('Honda', 'CR-V', 2018, 24000, 20000, 32000, 0),
('Honda', 'CR-V', 2020, 28000, 24000, 37000, 0),
('Honda', 'CR-V', 2022, 32000, 27000, 42000, 0),
('Honda', 'CR-V', 2024, 36000, 31000, 46000, 0);

-- ============================================
-- GMC MODELS
-- ============================================

-- GMC Sierra
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('GMC', 'Sierra', 2000, 12000, 8500, 17500, 0),
('GMC', 'Sierra', 2005, 16000, 11500, 23000, 0),
('GMC', 'Sierra', 2010, 23000, 17000, 31000, 0),
('GMC', 'Sierra', 2015, 33000, 27000, 43000, 0),
('GMC', 'Sierra', 2018, 40000, 33000, 50000, 0),
('GMC', 'Sierra', 2020, 47000, 40000, 58000, 0),
('GMC', 'Sierra', 2022, 54000, 46000, 67000, 0),
('GMC', 'Sierra', 2024, 60000, 52000, 74000, 0);

-- GMC Yukon
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('GMC', 'Yukon', 2005, 15000, 11000, 22000, 0),
('GMC', 'Yukon', 2010, 22000, 16000, 30000, 0),
('GMC', 'Yukon', 2015, 35000, 28000, 46000, 0),
('GMC', 'Yukon', 2018, 45000, 37000, 56000, 0),
('GMC', 'Yukon', 2020, 55000, 47000, 68000, 0),
('GMC', 'Yukon', 2022, 65000, 55000, 80000, 0),
('GMC', 'Yukon', 2024, 75000, 65000, 92000, 0);

-- ============================================
-- NISSAN MODELS
-- ============================================

-- Nissan Altima
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Nissan', 'Altima', 2000, 6500, 4500, 10000, 0),
('Nissan', 'Altima', 2005, 8500, 6000, 13000, 0),
('Nissan', 'Altima', 2010, 11000, 8000, 16000, 0),
('Nissan', 'Altima', 2015, 15000, 12000, 21000, 0),
('Nissan', 'Altima', 2018, 18000, 15000, 25000, 0),
('Nissan', 'Altima', 2020, 21000, 17000, 28000, 0),
('Nissan', 'Altima', 2022, 24000, 20000, 32000, 0),
('Nissan', 'Altima', 2024, 27000, 23000, 35000, 0);

-- Nissan Rogue
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Nissan', 'Rogue', 2010, 12000, 9000, 17000, 0),
('Nissan', 'Rogue', 2015, 16000, 13000, 22000, 0),
('Nissan', 'Rogue', 2018, 20000, 16000, 27000, 0),
('Nissan', 'Rogue', 2020, 24000, 20000, 32000, 0),
('Nissan', 'Rogue', 2022, 28000, 24000, 37000, 0),
('Nissan', 'Rogue', 2024, 32000, 27000, 41000, 0);

-- Nissan Titan
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Nissan', 'Titan', 2005, 12000, 9000, 18000, 0),
('Nissan', 'Titan', 2010, 18000, 13000, 25000, 0),
('Nissan', 'Titan', 2015, 25000, 20000, 34000, 0),
('Nissan', 'Titan', 2018, 30000, 25000, 40000, 0),
('Nissan', 'Titan', 2020, 35000, 29000, 46000, 0),
('Nissan', 'Titan', 2022, 40000, 34000, 52000, 0),
('Nissan', 'Titan', 2024, 45000, 38000, 58000, 0);

-- ============================================
-- JEEP MODELS
-- ============================================

-- Jeep Wrangler
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Jeep', 'Wrangler', 2000, 10000, 7000, 15000, 0),
('Jeep', 'Wrangler', 2005, 14000, 10000, 20000, 0),
('Jeep', 'Wrangler', 2010, 20000, 15000, 28000, 0),
('Jeep', 'Wrangler', 2015, 28000, 22000, 37000, 0),
('Jeep', 'Wrangler', 2018, 33000, 27000, 43000, 0),
('Jeep', 'Wrangler', 2020, 38000, 32000, 49000, 0),
('Jeep', 'Wrangler', 2022, 43000, 36000, 55000, 0),
('Jeep', 'Wrangler', 2024, 48000, 40000, 61000, 0);

-- Jeep Grand Cherokee
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Jeep', 'Grand Cherokee', 2000, 8000, 5500, 12500, 0),
('Jeep', 'Grand Cherokee', 2005, 11000, 8000, 17000, 0),
('Jeep', 'Grand Cherokee', 2010, 16000, 12000, 23000, 0),
('Jeep', 'Grand Cherokee', 2015, 25000, 20000, 34000, 0),
('Jeep', 'Grand Cherokee', 2018, 32000, 26000, 42000, 0),
('Jeep', 'Grand Cherokee', 2020, 38000, 32000, 49000, 0),
('Jeep', 'Grand Cherokee', 2022, 45000, 38000, 58000, 0),
('Jeep', 'Grand Cherokee', 2024, 52000, 44000, 66000, 0);

-- ============================================
-- DODGE MODELS
-- ============================================

-- Dodge Charger
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Dodge', 'Charger', 2010, 14000, 10000, 20000, 0),
('Dodge', 'Charger', 2015, 20000, 16000, 28000, 0),
('Dodge', 'Charger', 2018, 25000, 20000, 33000, 0),
('Dodge', 'Charger', 2020, 30000, 25000, 40000, 0),
('Dodge', 'Charger', 2022, 35000, 29000, 46000, 0),
('Dodge', 'Charger', 2024, 40000, 33000, 52000, 0);

-- Dodge Durango
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Dodge', 'Durango', 2010, 13000, 9500, 19000, 0),
('Dodge', 'Durango', 2015, 22000, 17000, 30000, 0),
('Dodge', 'Durango', 2018, 28000, 23000, 37000, 0),
('Dodge', 'Durango', 2020, 35000, 29000, 45000, 0),
('Dodge', 'Durango', 2022, 42000, 35000, 54000, 0),
('Dodge', 'Durango', 2024, 48000, 40000, 61000, 0);

-- ============================================
-- HYUNDAI MODELS
-- ============================================

-- Hyundai Elantra
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Hyundai', 'Elantra', 2005, 5500, 3500, 8500, 0),
('Hyundai', 'Elantra', 2010, 8000, 6000, 12000, 0),
('Hyundai', 'Elantra', 2015, 11000, 8500, 16000, 0),
('Hyundai', 'Elantra', 2018, 14000, 11000, 19000, 0),
('Hyundai', 'Elantra', 2020, 17000, 14000, 23000, 0),
('Hyundai', 'Elantra', 2022, 20000, 17000, 27000, 0),
('Hyundai', 'Elantra', 2024, 23000, 19000, 30000, 0);

-- Hyundai Tucson
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Hyundai', 'Tucson', 2010, 10000, 7500, 15000, 0),
('Hyundai', 'Tucson', 2015, 14000, 11000, 20000, 0),
('Hyundai', 'Tucson', 2018, 18000, 15000, 25000, 0),
('Hyundai', 'Tucson', 2020, 22000, 18000, 29000, 0),
('Hyundai', 'Tucson', 2022, 26000, 22000, 34000, 0),
('Hyundai', 'Tucson', 2024, 30000, 25000, 39000, 0);

-- ============================================
-- KIA MODELS
-- ============================================

-- Kia Optima
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Kia', 'Optima', 2010, 9000, 6500, 13500, 0),
('Kia', 'Optima', 2015, 13000, 10000, 19000, 0),
('Kia', 'Optima', 2018, 16000, 13000, 22000, 0),
('Kia', 'Optima', 2020, 19000, 16000, 26000, 0);

-- Kia Sorento
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Kia', 'Sorento', 2010, 11000, 8000, 16000, 0),
('Kia', 'Sorento', 2015, 16000, 13000, 23000, 0),
('Kia', 'Sorento', 2018, 20000, 17000, 28000, 0),
('Kia', 'Sorento', 2020, 25000, 21000, 33000, 0),
('Kia', 'Sorento', 2022, 30000, 25000, 39000, 0),
('Kia', 'Sorento', 2024, 35000, 29000, 45000, 0);

-- ============================================
-- TESLA MODELS
-- ============================================

-- Tesla Model 3
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Tesla', 'Model 3', 2018, 35000, 30000, 45000, 0),
('Tesla', 'Model 3', 2020, 40000, 35000, 50000, 0),
('Tesla', 'Model 3', 2022, 45000, 40000, 55000, 0),
('Tesla', 'Model 3', 2024, 42000, 37000, 52000, 0);

-- Tesla Model Y
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Tesla', 'Model Y', 2020, 50000, 45000, 60000, 0),
('Tesla', 'Model Y', 2022, 55000, 50000, 67000, 0),
('Tesla', 'Model Y', 2024, 52000, 47000, 63000, 0);

-- ============================================
-- SUBARU MODELS
-- ============================================

-- Subaru Outback
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Subaru', 'Outback', 2010, 12000, 9000, 17000, 0),
('Subaru', 'Outback', 2015, 18000, 14000, 25000, 0),
('Subaru', 'Outback', 2018, 23000, 19000, 31000, 0),
('Subaru', 'Outback', 2020, 28000, 24000, 37000, 0),
('Subaru', 'Outback', 2022, 32000, 27000, 42000, 0),
('Subaru', 'Outback', 2024, 36000, 31000, 47000, 0);

-- Subaru Forester
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Subaru', 'Forester', 2010, 11000, 8500, 16000, 0),
('Subaru', 'Forester', 2015, 17000, 13500, 23000, 0),
('Subaru', 'Forester', 2018, 22000, 18000, 29000, 0),
('Subaru', 'Forester', 2020, 26000, 22000, 34000, 0),
('Subaru', 'Forester', 2022, 30000, 25000, 39000, 0),
('Subaru', 'Forester', 2024, 34000, 29000, 44000, 0);

-- ============================================
-- MAZDA MODELS
-- ============================================

-- Mazda CX-5
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Mazda', 'CX-5', 2015, 16000, 13000, 22000, 0),
('Mazda', 'CX-5', 2018, 21000, 17000, 28000, 0),
('Mazda', 'CX-5', 2020, 25000, 21000, 33000, 0),
('Mazda', 'CX-5', 2022, 29000, 25000, 38000, 0),
('Mazda', 'CX-5', 2024, 33000, 28000, 43000, 0);

-- Mazda3
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Mazda', 'Mazda3', 2010, 8500, 6500, 12500, 0),
('Mazda', 'Mazda3', 2015, 13000, 10000, 18000, 0),
('Mazda', 'Mazda3', 2018, 16000, 13000, 22000, 0),
('Mazda', 'Mazda3', 2020, 19000, 16000, 26000, 0),
('Mazda', 'Mazda3', 2022, 22000, 18000, 29000, 0),
('Mazda', 'Mazda3', 2024, 25000, 21000, 33000, 0);

-- ============================================
-- VOLKSWAGEN MODELS
-- ============================================

-- Volkswagen Jetta
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Volkswagen', 'Jetta', 2010, 8000, 6000, 12000, 0),
('Volkswagen', 'Jetta', 2015, 12000, 9500, 17000, 0),
('Volkswagen', 'Jetta', 2018, 15000, 12000, 21000, 0),
('Volkswagen', 'Jetta', 2020, 18000, 15000, 25000, 0),
('Volkswagen', 'Jetta', 2022, 21000, 17000, 28000, 0),
('Volkswagen', 'Jetta', 2024, 24000, 20000, 32000, 0);

-- Volkswagen Tiguan
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price, min_price, max_price, sample_count) VALUES
('Volkswagen', 'Tiguan', 2015, 15000, 12000, 21000, 0),
('Volkswagen', 'Tiguan', 2018, 19000, 16000, 26000, 0),
('Volkswagen', 'Tiguan', 2020, 23000, 19000, 31000, 0),
('Volkswagen', 'Tiguan', 2022, 27000, 23000, 36000, 0),
('Volkswagen', 'Tiguan', 2024, 31000, 26000, 41000, 0);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- After inserting, verify the data:
-- SELECT COUNT(*) FROM vehicle_price_benchmarks;
-- SELECT brand, COUNT(*) as model_count FROM vehicle_price_benchmarks GROUP BY brand ORDER BY model_count DESC;
-- SELECT * FROM vehicle_price_benchmarks WHERE brand = 'Ford' AND model = 'F-150' ORDER BY year;

-- Test the price badge function:
-- SELECT get_price_badge('Ford', 'F-150', 2020, 30000); -- Should return 'good' (30k < 80% of 45k)
-- SELECT get_price_badge('Ford', 'F-150', 2020, 45000); -- Should return 'fair' (45k = avg)
-- SELECT get_price_badge('Ford', 'F-150', 2020, 60000); -- Should return 'high' (60k > 120% of 45k)
