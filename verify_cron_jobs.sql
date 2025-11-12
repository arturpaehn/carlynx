-- Проверить обновленные cron job задачи
SELECT 
  jobid,
  schedule,
  command,
  active,
  jobname
FROM cron.job
ORDER BY jobid;
