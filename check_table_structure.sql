-- ============================================
-- 🔍 УЗНАТЬ СТРУКТУРУ ТАБЛИЦЫ subscription_tiers
-- ============================================

-- Сначала узнаем, какие колонки есть в таблице
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_tiers'
ORDER BY ordinal_position;

-- Или посмотрим все данные (если таблица не пустая)
SELECT *
FROM subscription_tiers
LIMIT 5;
