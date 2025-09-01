-- Безопасное исправление регистрации
-- Проверяем существующие политики, НЕ удаляя их

-- 1. Показать текущие политики
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- 2. Проверить, есть ли проблема с INSERT политикой
-- Текущая политика "Users can insert own profile" имеет with_check: "(auth.uid() = user_id)"
-- Это должно работать, но давайте убедимся

-- 3. Возможное решение: создать альтернативную INSERT политику для регистрации
-- Только если текущая не работает
-- CREATE POLICY "Allow profile creation during registration" ON user_profiles
--   FOR INSERT
--   WITH CHECK (
--     auth.uid() = user_id 
--     AND auth.jwt() ->> 'aud' = 'authenticated'
--   );

-- 4. Альтернативное решение: временно отключить RLS для тестирования
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- После тестирования включить обратно:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- РЕКОМЕНДАЦИЯ: Сначала попробуйте зарегистрироваться с отключенным RLS
-- Если работает, значит проблема в политиках. Тогда создадим правильную политику.
