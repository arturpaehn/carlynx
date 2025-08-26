-- RLS политики для таблицы user_profiles
-- Выполните в Supabase Dashboard → SQL Editor

-- 1. Включить RLS для таблицы user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Удалить все существующие политики (если есть)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.user_profiles;

-- 3. Политика чтения - пользователи видят только свой профиль
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Политика создания - пользователи могут создать только свой профиль
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Политика обновления - пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Политика удаления - пользователи могут удалить только свой профиль  
CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Админская политика - admin@carlynx.us может управлять всеми профилями
CREATE POLICY "Admin can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'admin@carlynx.us'
  );

-- 8. ВАЖНО: Recovery сессии могут читать и обновлять профиль пользователя
-- Это нужно для корректной работы password reset и других auth операций
CREATE POLICY "Allow auth operations on own profile" ON public.user_profiles
  FOR ALL USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'aud' = 'authenticated'
  );

-- Проверить созданные политики:
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Проверить статус RLS:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles' AND schemaname = 'public';
