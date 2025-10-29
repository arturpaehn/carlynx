-- Проверка конкретного объявления
SELECT 
  id,
  external_id,
  source,
  title,
  brand,
  model,
  year,
  price,
  is_active,
  created_at,
  updated_at,
  last_seen_at,
  AGE(NOW(), last_seen_at) as days_since_last_seen,
  AGE(NOW(), created_at) as listing_age
FROM external_listings
WHERE id = 'd5e16a80-93e7-4527-9e69-5b09b03eb75a';

-- Проверка всех старых активных объявлений (старше 30 дней)
SELECT 
  id,
  source,
  title,
  brand,
  model,
  is_active,
  last_seen_at,
  AGE(NOW(), last_seen_at) as days_since_last_seen
FROM external_listings
WHERE is_active = true 
  AND last_seen_at < NOW() - INTERVAL '30 days'
ORDER BY last_seen_at ASC
LIMIT 20;

-- Проверка существующих cron jobs для деактивации
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname LIKE '%deactivate%' OR jobname LIKE '%external_listings%';

-- Проверка функций для деактивации
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%deactivate%' OR routine_name LIKE '%external_listing%')
ORDER BY routine_name;

-- Проверка триггеров на таблице external_listings
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'external_listings';
