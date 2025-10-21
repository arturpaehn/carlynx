// =================================================================
// СКРИПТ ДЛЯ ПРОВЕРКИ ОШИБОК В MONITORING СИСТЕМЕ
// =================================================================

// Выполните этот код в консоли браузера на странице carlynx.us

// 1. Получить все логи из localStorage
const logs = JSON.parse(localStorage.getItem('carlynx_logs') || '[]');

// 2. Найти все ошибки
const errors = logs.filter(log => log.level === 'error');

console.log('=== НАЙДЕННЫЕ ОШИБКИ ===');
console.log('Всего логов:', logs.length);
console.log('Ошибок найдено:', errors.length);

// 3. Показать детали ошибок
errors.forEach((error, index) => {
  console.log(`\n--- ОШИБКА ${index + 1} ---`);
  console.log('Время:', new Date(error.timestamp).toLocaleString());
  console.log('Событие:', error.event);
  console.log('URL:', error.url);
  console.log('Данные:', error.data);
});

// 4. Статистика по типам событий за последний час
const hourAgo = Date.now() - (60 * 60 * 1000);
const recentLogs = logs.filter(log => log.timestamp > hourAgo);

const eventCounts = {};
recentLogs.forEach(log => {
  eventCounts[log.event] = (eventCounts[log.event] || 0) + 1;
});

console.log('\n=== СТАТИСТИКА СОБЫТИЙ (последний час) ===');
Object.entries(eventCounts).sort(([,a], [,b]) => b - a).forEach(([event, count]) => {
  console.log(`${event}: ${count}`);
});

// 5. Экспорт логов для анализа
console.log('\n=== ЭКСПОРТ ЛОГОВ ===');
console.log('Для детального анализа выполните:');
console.log('copy(JSON.stringify(JSON.parse(localStorage.getItem("carlynx_logs") || "[]"), null, 2))');

// 6. Очистка старых логов (опционально)
// localStorage.removeItem('carlynx_logs');