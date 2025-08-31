-- Добавление поля engine_size для всех транспортных средств
-- Выполнить в Supabase SQL Editor
-- Этот скрипт только для добавления поля engine_size, остальные изменения уже должны быть в базе

-- Проверяем, существует ли уже поле engine_size
DO $$ 
BEGIN
    -- Проверяем существование поля
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'engine_size'
    ) THEN
        -- Добавляем поле engine_size в кубических сантиметрах (INTEGER для всех типов)
        -- Машины будут конвертироваться: 2.0L = 2000cc, мотоциклы вводятся напрямую
        ALTER TABLE listings 
        ADD COLUMN engine_size INTEGER;
        
        RAISE NOTICE 'Поле engine_size успешно добавлено в таблицу listings';
    ELSE
        RAISE NOTICE 'Поле engine_size уже существует в таблице listings';
    END IF;
END $$;

-- Добавляем индекс для оптимизации поиска по объему двигателя (если не существует)
CREATE INDEX IF NOT EXISTS idx_listings_engine_size ON listings(engine_size);

-- Готово! Поле engine_size добавлено для всех типов транспорта
