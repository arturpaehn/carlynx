-- Удалить старые cron job задачи
SELECT cron.unschedule(1);
SELECT cron.unschedule(2);

-- Создать новый cron job: деактивация после 14 дней
SELECT cron.schedule(
  'deactivate_after_14_days',
  '0 3 * * *',
  $$
    UPDATE public.listings
       SET is_active = false
     WHERE is_active = true
       AND created_at < NOW() - INTERVAL '14 days';
  $$
);

-- Создать новый cron job: удаление после 3 месяцев
SELECT cron.schedule(
  'delete_after_3_months',
  '30 3 * * *',
  $$
    DELETE FROM public.listing_images li
     USING public.listings l
     WHERE li.listing_id = l.id
       AND l.created_at < NOW() - INTERVAL '3 months';

    DELETE FROM public.listings
     WHERE created_at < NOW() - INTERVAL '3 months';
  $$
);
