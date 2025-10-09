-- QUERY 1: LIST ALL TABLES
SELECT 
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
