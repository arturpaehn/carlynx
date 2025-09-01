-- Безопасный триггер для автоматического создания профиля
-- Создается ТОЛЬКО при INSERT в auth.users, не влияет на существующие данные

-- 1. Создаем функцию триггера
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Создаем запись в user_profiles для нового пользователя
  INSERT INTO public.user_profiles (
    user_id, 
    name, 
    phone, 
    email,
    dealer_attempts_count,
    is_blocked,
    abuse_attempts_count
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    COALESCE(NEW.email, ''),
    0,
    false,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Создаем триггер на INSERT в auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Проверяем, что триггер создался
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';
