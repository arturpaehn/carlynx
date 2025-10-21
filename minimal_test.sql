-- =================================================================
-- МИНИМАЛЬНЫЙ ТЕСТ - ОДНА ПОЛИТИКА
-- =================================================================

-- Сначала посмотрим текущее состояние одной политики
SELECT 
    'ДО ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'individual_payments' 
AND policyname = 'Users can view their own payments';

-- Попытаемся изменить ОДНУ простую политику
ALTER POLICY "Users can view their own payments" ON public.individual_payments 
USING (((select auth.uid()) = user_id));

-- Проверим результат
SELECT 
    'ПОСЛЕ ИЗМЕНЕНИЯ' as status,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'individual_payments' 
AND policyname = 'Users can view their own payments';