-- QUERY 5: USER PROFILES STRUCTURE
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
