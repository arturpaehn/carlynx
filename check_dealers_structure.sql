-- QUERY 2: DEALERS TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'dealers'
ORDER BY ordinal_position;
