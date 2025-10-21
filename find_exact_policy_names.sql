-- =================================================================
-- НАЙТИ ТОЧНЫЕ ИМЕНА ПОЛИТИК ДЛЯ ОПТИМИЗАЦИИ
-- =================================================================

-- Показать ВСЕ политики с auth.uid() которые нужно оптимизировать
SELECT 
    'ПОЛИТИКИ ДЛЯ ОПТИМИЗАЦИИ' as info,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE qual LIKE '%auth.uid()%' 
AND qual NOT LIKE '%(select auth.uid())%'
ORDER BY tablename, policyname;