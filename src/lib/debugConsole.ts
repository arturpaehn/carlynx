// Утилиты для просмотра логов мониторинга в браузере
import { monitor } from './monitoring';

// Добавляем глобальные функции для отладки
declare global {
  interface Window {
    carlynxLogs: () => void;
    carlynxClearLogs: () => void;
    carlynxExportLogs: () => void;
    carlynxMonitor: typeof monitor;
  }
}

// Инициализация отладочных функций
export function initDebugConsole() {
  if (typeof window === 'undefined') return;

  // Функция для просмотра логов
  window.carlynxLogs = () => {
    const logs = monitor.exportLocalLogs();
    console.group('🔍 CarLynx Production Logs');
    console.log(`Total logs: ${logs.length}`);
    
    logs.forEach((log) => {
      const emoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        debug: '🐛'
      }[log.level] || '📝';
      
      console.group(`${emoji} ${new Date(log.timestamp).toLocaleTimeString()} - ${log.event}`);
      console.log('Level:', log.level);
      console.log('Session:', log.sessionId);
      console.log('URL:', log.url);
      console.log('User Agent:', log.userAgent);
      if (log.data) {
        console.log('Data:', log.data);
      }
      console.groupEnd();
    });
    
    console.groupEnd();
    console.log('💡 Use carlynxClearLogs() to clear logs');
    console.log('💡 Use carlynxExportLogs() to export as JSON');
  };

  // Функция очистки логов
  window.carlynxClearLogs = () => {
    monitor.clearLogs();
    console.log('🗑️ Logs cleared');
  };

  // Функция экспорта логов
  window.carlynxExportLogs = () => {
    const logs = monitor.exportLocalLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `carlynx-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📥 Logs exported to file');
  };

  // Доступ к monitor объекту
  window.carlynxMonitor = monitor;

  console.log('🚀 CarLynx Debug Console Initialized');
  console.log('📋 Available commands:');
  console.log('  carlynxLogs() - View all logs');
  console.log('  carlynxClearLogs() - Clear logs');
  console.log('  carlynxExportLogs() - Export logs to file');
  console.log('  carlynxMonitor - Access monitor object directly');
}

// Автоматическая инициализация
if (typeof window !== 'undefined') {
  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugConsole);
  } else {
    initDebugConsole();
  }
}