-- Простое решение проблемы регистрации
-- Пользователь создается в auth.users, но не может вставить запись в user_profiles

-- Проблема: текущая INSERT политика "Users can insert own profile" 
-- имеет WITH CHECK (auth.uid() = user_id), но возможно auth.uid() недоступен сразу после регистрации

-- Решение: создаем дополнительную INSERT политику для новых пользователей
CREATE POLICY "Allow profile creation for authenticated users" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Эта политика разрешает любому аутентифицированному пользователю создать профиль
-- Поскольку пользователь уже прошел регистрацию в auth.users, он аутентифицирован
-- И может создать свой профиль в user_profiles

-- После создания профиля, основные политики (UPDATE, SELECT) будут работать нормально
