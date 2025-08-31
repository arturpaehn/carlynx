-- Добавление поддержки мотоциклов в CarLynx
-- Выполнить в Supabase SQL Editor

-- 1. Добавить поле vehicle_type в таблицу listings
ALTER TABLE listings 
ADD COLUMN vehicle_type TEXT DEFAULT 'car' 
CHECK (vehicle_type IN ('car', 'motorcycle'));

-- 2. Обновить все существующие записи как автомобили
UPDATE listings 
SET vehicle_type = 'car' 
WHERE vehicle_type IS NULL;

-- 3. Создать таблицу брендов мотоциклов
CREATE TABLE IF NOT EXISTS motorcycle_brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Вставить популярные бренды мотоциклов
INSERT INTO motorcycle_brands (name) VALUES 
('Honda'),
('Yamaha'), 
('Kawasaki'),
('Suzuki'),
('Ducati'),
('BMW'),
('KTM'),
('Harley-Davidson'),
('Triumph'),
('Aprilia'),
('Can-Am'),
('Indian'),
('Moto Guzzi'),
('MV Agusta'),
('Benelli'),
('Royal Enfield'),
('Zero'),
('Energica'),
('Husqvarna'),
('Gas Gas')
ON CONFLICT (name) DO NOTHING;

-- 5. Добавить поле engine_size для всех транспортных средств (в литрах)
ALTER TABLE listings 
ADD COLUMN engine_size DECIMAL(3,1);

-- 6. Создать индексы для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_listings_vehicle_type ON listings(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_listings_vehicle_type_active ON listings(vehicle_type, is_active);

-- 7. Обновить RLS политики, если нужно (опционально)
-- Текущие политики должны работать, так как мы не меняем структуру безопасности

-- 8. Создать view для удобного получения данных с брендами
CREATE OR REPLACE VIEW listings_with_brands AS
SELECT 
    l.*,
    cb.name as car_brand_name,
    mb.name as motorcycle_brand_name,
    CASE 
        WHEN l.vehicle_type = 'car' THEN cb.name
        WHEN l.vehicle_type = 'motorcycle' THEN mb.name
        ELSE l.title
    END as brand_name
FROM listings l
LEFT JOIN car_brands cb ON l.vehicle_type = 'car' AND cb.name = l.title
LEFT JOIN motorcycle_brands mb ON l.vehicle_type = 'motorcycle' AND mb.name = l.title;

-- Готово! Теперь база данных поддерживает мотоциклы
