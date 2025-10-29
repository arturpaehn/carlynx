-- ============================================
-- 🧪 SQL-скрипты для тестирования дилерских подписок
-- ============================================
-- Используй эти скрипты в Supabase SQL Editor
-- Замени 'YOUR_EMAIL@example.com' на свой email

-- ============================================
-- 📋 1. ПРОВЕРКА ТЕКУЩЕГО СТАТУСА
-- ============================================

-- Посмотреть свою информацию дилера
SELECT 
  d.user_id,
  up.email,
  up.name,
  d.subscription_status,
  d.trial_end_date,
  d.current_tier_id,
  d.subscription_start_date,
  d.subscription_end_date,
  d.cancel_at_period_end,
  CASE 
    WHEN d.trial_end_date IS NOT NULL AND d.trial_end_date < NOW() 
    THEN 'EXPIRED ❌' 
    ELSE 'ACTIVE ✅' 
  END as trial_status
FROM dealers d
JOIN user_profiles up ON d.user_id = up.user_id
WHERE up.email = 'YOUR_EMAIL@example.com';

-- Посмотреть количество активных объявлений
SELECT 
  COUNT(*) as active_listings_count,
  up.email
FROM listings l
JOIN user_profiles up ON l.user_id = up.user_id
WHERE up.email = 'YOUR_EMAIL@example.com'
  AND l.is_active = true
GROUP BY up.email;

-- Посмотреть доступные пакеты подписок
SELECT 
  tier_id,
  tier_name,
  monthly_price,
  listing_limit,
  active,
  CASE 
    WHEN listing_limit IS NULL THEN 'Unlimited ∞'
    ELSE listing_limit::text
  END as listings_display
FROM subscription_tiers
WHERE active = true
ORDER BY monthly_price;


-- ============================================
-- 🎯 2. АКТИВИРОВАТЬ 7-ДНЕВНЫЙ ТРИАЛ
-- ============================================

-- Начать триал прямо сейчас (7 дней с неограниченными объявлениями)
UPDATE dealers 
SET 
  subscription_status = 'trial',
  trial_end_date = NOW() + INTERVAL '7 days',
  current_tier_id = 'tier_100',  -- Любой tier, триал даёт неограниченно
  subscription_start_date = NOW(),
  subscription_end_date = NULL,
  cancel_at_period_end = false,
  cancellation_scheduled_for = NULL
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING *;


-- ============================================
-- ⏰ 3. СИМУЛИРОВАТЬ ИСТЕЧЕНИЕ ТРИАЛА
-- ============================================

-- Сделать триал истекшим вчера (для проверки блокировки)
UPDATE dealers 
SET 
  subscription_status = 'trial',  -- Оставляем 'trial', но дата истекла
  trial_end_date = NOW() - INTERVAL '1 day'  -- Вчера истёк
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING subscription_status, trial_end_date;

-- После этого НЕ должно быть возможности добавлять объявления!


-- ============================================
-- 💳 4. АКТИВИРОВАТЬ ПЛАТНУЮ ПОДПИСКУ
-- ============================================

-- Симулировать успешную покупку Tier 100 (100 объявлений)
UPDATE dealers 
SET 
  subscription_status = 'active',
  current_tier_id = 'tier_100',
  trial_end_date = NULL,
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '30 days',
  cancel_at_period_end = false,
  cancellation_scheduled_for = NULL,
  stripe_subscription_id = 'sub_test_' || gen_random_uuid()  -- Фейковый ID для теста
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING *;

-- Tier 250 (250 объявлений)
UPDATE dealers 
SET 
  subscription_status = 'active',
  current_tier_id = 'tier_250',
  trial_end_date = NULL,
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '30 days',
  cancel_at_period_end = false,
  stripe_subscription_id = 'sub_test_' || gen_random_uuid()
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING *;

-- Tier Unlimited (неограниченно)
UPDATE dealers 
SET 
  subscription_status = 'active',
  current_tier_id = 'tier_unlimited',
  trial_end_date = NULL,
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '30 days',
  cancel_at_period_end = false,
  stripe_subscription_id = 'sub_test_' || gen_random_uuid()
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING *;


-- ============================================
-- 🚫 5. СИМУЛИРОВАТЬ ОТМЕНУ ПОДПИСКИ
-- ============================================

-- Запланировать отмену на конец периода (как в Stripe)
UPDATE dealers 
SET 
  cancel_at_period_end = true,
  cancellation_scheduled_for = subscription_end_date
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING subscription_end_date, cancel_at_period_end, cancellation_scheduled_for;

-- Немедленная отмена подписки
UPDATE dealers 
SET 
  subscription_status = 'canceled',
  subscription_end_date = NOW(),
  cancel_at_period_end = false,
  cancellation_scheduled_for = NULL
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING *;


-- ============================================
-- ⚠️ 6. ПРОСРОЧКА ПЛАТЕЖА (past_due)
-- ============================================

-- Симулировать просрочку платежа
UPDATE dealers 
SET 
  subscription_status = 'past_due',
  subscription_end_date = NOW() + INTERVAL '3 days'  -- Stripe даёт время оплатить
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING *;


-- ============================================
-- 🔄 7. РЕАКТИВИРОВАТЬ ОТМЕНЁННУЮ ПОДПИСКУ
-- ============================================

-- Отменить запланированную отмену
UPDATE dealers 
SET 
  cancel_at_period_end = false,
  cancellation_scheduled_for = NULL
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING *;


-- ============================================
-- 📊 8. СТАТИСТИКА И АНАЛИТИКА
-- ============================================

-- Посмотреть все объявления дилера
SELECT 
  l.id,
  l.title,
  l.price,
  l.is_active,
  l.created_at,
  CASE 
    WHEN l.is_active THEN '✅ Active'
    ELSE '❌ Inactive'
  END as status
FROM listings l
JOIN user_profiles up ON l.user_id = up.user_id
WHERE up.email = 'YOUR_EMAIL@example.com'
ORDER BY l.created_at DESC;

-- Посмотреть всех дилеров и их статусы (админ-запрос)
SELECT 
  up.email,
  up.name,
  d.subscription_status,
  d.current_tier_id,
  st.listing_limit,
  COUNT(l.id) FILTER (WHERE l.is_active = true) as active_listings,
  d.trial_end_date,
  CASE 
    WHEN d.trial_end_date IS NOT NULL AND d.trial_end_date < NOW() 
    THEN '❌ Trial Expired' 
    WHEN d.trial_end_date IS NOT NULL 
    THEN '✅ Trial Active'
    ELSE '-'
  END as trial_status
FROM dealers d
JOIN user_profiles up ON d.user_id = up.user_id
LEFT JOIN subscription_tiers st ON d.current_tier_id = st.tier_id
LEFT JOIN listings l ON d.user_id = l.user_id AND l.is_active = true
WHERE up.user_type = 'dealer'
GROUP BY up.email, up.name, d.subscription_status, d.current_tier_id, 
         st.listing_limit, d.trial_end_date
ORDER BY d.subscription_status, up.email;


-- ============================================
-- 🔧 9. ЧИСТКА И СБРОС (для тестирования)
-- ============================================

-- ВНИМАНИЕ! Удалит все объявления дилера (для чистого теста)
DELETE FROM listings
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING id, title;

-- Сбросить дилера к начальному состоянию (без подписки)
UPDATE dealers 
SET 
  subscription_status = 'inactive',
  current_tier_id = NULL,
  trial_end_date = NULL,
  subscription_start_date = NULL,
  subscription_end_date = NULL,
  cancel_at_period_end = false,
  cancellation_scheduled_for = NULL,
  stripe_subscription_id = NULL,
  stripe_customer_id = NULL
WHERE user_id = (
  SELECT user_id FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com'
)
RETURNING *;


-- ============================================
-- 🎯 10. ТЕСТОВЫЕ СЦЕНАРИИ
-- ============================================

-- Сценарий 1: Начать триал → Добавить 5 объявлений → Истечь триал → Проверить блокировку
-- Шаг 1: Активировать триал (выполни запрос из раздела 2)
-- Шаг 2: Добавь объявления через UI
-- Шаг 3: Истечь триал (выполни запрос из раздела 3)
-- Шаг 4: Попробуй добавить объявление - должна быть блокировка!

-- Сценарий 2: Купить Tier 100 → Добавить 100 объявлений → Попробовать добавить 101-е
-- Шаг 1: Активировать Tier 100 (выполни запрос из раздела 4)
-- Шаг 2: Проверь, что лимит работает:
SELECT 
  COUNT(*) as active_count,
  st.listing_limit as limit,
  CASE 
    WHEN COUNT(*) >= st.listing_limit THEN '🚫 Limit Reached'
    ELSE '✅ Can Add More'
  END as can_add
FROM listings l
JOIN dealers d ON l.user_id = d.user_id
JOIN subscription_tiers st ON d.current_tier_id = st.tier_id
JOIN user_profiles up ON d.user_id = up.user_id
WHERE up.email = 'YOUR_EMAIL@example.com'
  AND l.is_active = true
GROUP BY st.listing_limit;


-- ============================================
-- 🔍 11. ДЕБАГ И ДИАГНОСТИКА
-- ============================================

-- Найти несоответствия (дилеры с истекшим триалом, но статус 'trial')
SELECT 
  up.email,
  d.subscription_status,
  d.trial_end_date,
  CASE 
    WHEN d.trial_end_date < NOW() THEN '⚠️ Should be inactive!'
    ELSE '✅ OK'
  END as consistency_check
FROM dealers d
JOIN user_profiles up ON d.user_id = up.user_id
WHERE d.subscription_status = 'trial'
  AND d.trial_end_date < NOW();

-- Найти дилеров с активными объявлениями без подписки
SELECT 
  up.email,
  d.subscription_status,
  COUNT(l.id) as active_listings,
  '⚠️ Should be blocked!' as warning
FROM dealers d
JOIN user_profiles up ON d.user_id = up.user_id
LEFT JOIN listings l ON d.user_id = l.user_id AND l.is_active = true
WHERE d.subscription_status IN ('inactive', 'canceled')
  AND l.id IS NOT NULL
GROUP BY up.email, d.subscription_status
HAVING COUNT(l.id) > 0;


-- ============================================
-- 🎁 12. СОЗДАТЬ ТЕСТОВЫЕ ДАННЫЕ (для демо)
-- ============================================

-- Создать несколько тестовых дилеров с разными статусами
-- (Требует создания пользователей через UI, затем обнови их статусы)

-- Пример обновления для демо:
-- Dealer 1: Active trial
UPDATE dealers SET subscription_status = 'trial', trial_end_date = NOW() + INTERVAL '5 days'
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'dealer1@test.com');

-- Dealer 2: Active subscription
UPDATE dealers SET subscription_status = 'active', current_tier_id = 'tier_250'
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'dealer2@test.com');

-- Dealer 3: Canceled
UPDATE dealers SET subscription_status = 'canceled'
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'dealer3@test.com');


-- ============================================
-- ✅ БЫСТРАЯ ПРОВЕРКА ПОСЛЕ ПРАВКИ КОДА
-- ============================================

-- Этот запрос покажет, правильно ли работает новая логика:
SELECT 
  up.email,
  d.subscription_status,
  d.trial_end_date,
  st.listing_limit,
  COUNT(l.id) FILTER (WHERE l.is_active = true) as active_listings,
  CASE 
    -- Правильная логика: 'trial' (не 'trialing')
    WHEN d.subscription_status = 'trial' AND d.trial_end_date > NOW() 
    THEN '✅ Can add unlimited (trial active)'
    
    WHEN d.subscription_status = 'trial' AND d.trial_end_date < NOW() 
    THEN '🚫 Trial expired - must buy'
    
    WHEN d.subscription_status = 'active' AND st.listing_limit IS NULL
    THEN '✅ Can add unlimited (unlimited tier)'
    
    WHEN d.subscription_status = 'active' AND COUNT(l.id) FILTER (WHERE l.is_active = true) < st.listing_limit
    THEN '✅ Can add more (within limit)'
    
    WHEN d.subscription_status = 'active' AND COUNT(l.id) FILTER (WHERE l.is_active = true) >= st.listing_limit
    THEN '🚫 Limit reached'
    
    ELSE '🚫 No subscription or inactive'
  END as listing_permission
FROM dealers d
JOIN user_profiles up ON d.user_id = up.user_id
LEFT JOIN subscription_tiers st ON d.current_tier_id = st.tier_id
LEFT JOIN listings l ON d.user_id = l.user_id AND l.is_active = true
WHERE up.email = 'YOUR_EMAIL@example.com'
GROUP BY up.email, d.subscription_status, d.trial_end_date, st.listing_limit;

-- ============================================
-- 🎉 ГОТОВО!
-- ============================================
-- Скопируй нужные запросы и замени YOUR_EMAIL@example.com на свой email
-- Все изменения можно откатить через запросы из раздела 9
