// Система мониторинга для отладки production проблем

// Extend window interface for debugging
declare global {
  interface Window {
    productionMonitor: ProductionMonitor;
    carlynxLogs: () => {
      all: LogEvent[];
      errors: LogEvent[];
      warnings: LogEvent[];
      count: {
        total: number;
        errors: number;
        warnings: number;
        info: number;
        debug: number;
      };
      ui: () => void;
    };
    carlynxClearLogs: () => void;
    carlynxExportLogs: () => void;
    carlynxMonitor: ProductionMonitor;
  }
}

export interface LogEvent {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  event: string;
  data?: unknown;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId: string;
}

class ProductionMonitor {
  private sessionId: string;
  private logs: LogEvent[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Инициализируем только в браузере
    if (typeof window !== 'undefined') {
      this.initPerformanceMonitoring();
      this.initNetworkMonitoring();
      this.initErrorHandling();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Основной метод логирования
  log(level: LogEvent['level'], event: string, data?: unknown) {
    const logEntry: LogEvent = {
      timestamp: Date.now(),
      level,
      event,
      data,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      sessionId: this.sessionId
    };

    this.logs.push(logEntry);

    // Консоль для разработки
    if (!this.isProduction) {
      console.log(`[${level.toUpperCase()}] ${event}:`, data);
    }

    // Отправляем в внешний сервис в production
    if (this.isProduction) {
      this.sendToExternalService(logEntry);
    }

    // Сохраняем в localStorage для отладки
    this.saveToLocalStorage(logEntry);
  }

  // Отправка в внешний сервис (disabled - use localStorage instead)
  private async sendToExternalService(logEntry: LogEvent) {
    // Disabled due to CORS issues
    // Use localStorage and exportLocalLogs() for debugging instead
    void logEntry; // Mark as intentionally unused
  }

  // Сохранение в localStorage для локальной отладки
  private saveToLocalStorage(logEntry: LogEvent) {
    if (typeof window === 'undefined') return;

    try {
      const existingLogs = localStorage.getItem('carlynx_monitoring_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(logEntry);
      
      // Держим только последние 100 записей
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('carlynx_monitoring_logs', JSON.stringify(logs));
      localStorage.setItem('carlynx_monitoring_last_update', Date.now().toString());
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  // Мониторинг производительности
  private initPerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Page load timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.log('info', 'page_load_complete', {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart,
          networkTime: perfData.responseEnd - perfData.requestStart
        });
      }, 1000);
    });

    // Memory usage (если доступно)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        this.log('debug', 'memory_usage', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        });
      }, 30000); // Каждые 30 секунд
    }
  }

  // Мониторинг сети
  private initNetworkMonitoring() {
    if (typeof window === 'undefined') return;

    // Network connection info
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection: { effectiveType: string; downlink: number; rtt: number; saveData: boolean; addEventListener: (event: string, handler: () => void) => void } }).connection;
      this.log('info', 'network_info', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });

      connection.addEventListener('change', () => {
        this.log('warn', 'network_change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }

    // Online/offline events
    window.addEventListener('online', () => {
      this.log('info', 'network_online', { timestamp: Date.now() });
    });

    window.addEventListener('offline', () => {
      this.log('warn', 'network_offline', { timestamp: Date.now() });
    });
  }

  // Обработка ошибок
  private initErrorHandling() {
    if (typeof window === 'undefined') return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.log('error', 'javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'unhandled_promise_rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  // Мониторинг Supabase запросов
  trackSupabaseRequest(operation: string, startTime: number) {
    return {
      success: (data: unknown) => {
        this.log('info', 'supabase_success', {
          operation,
          duration: Date.now() - startTime,
          dataSize: JSON.stringify(data).length,
          recordCount: Array.isArray(data) ? data.length : data ? 1 : 0
        });
      },
      error: (error: unknown) => {
        this.log('error', 'supabase_error', {
          operation,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
          code: (error as { code?: string }).code,
          hint: (error as { hint?: string }).hint,
          details: (error as { details?: string }).details
        });
      }
    };
  }

  // Мониторинг React компонентов
  trackComponent(componentName: string, operation: string) {
    const startTime = Date.now();
    this.log('debug', 'component_operation_start', {
      component: componentName,
      operation
    });

    return {
      finish: (data?: unknown) => {
        this.log('debug', 'component_operation_finish', {
          component: componentName,
          operation,
          duration: Date.now() - startTime,
          data
        });
      },
      error: (error: unknown) => {
        this.log('error', 'component_operation_error', {
          component: componentName,
          operation,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    };
  }

  // Получить все логи (для отладки)
  getLogs(): LogEvent[] {
    return this.logs;
  }

  // Экспорт логов из localStorage
  exportLocalLogs(): LogEvent[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const logs = localStorage.getItem('carlynx_monitoring_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  // Очистить логи
  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('carlynx_monitoring_logs');
      localStorage.removeItem('carlynx_monitoring_last_update');
    }
  }

  // Получить количество ошибок
  getErrorCount(): number {
    const allLogs = [...this.logs, ...this.exportLocalLogs()];
    return allLogs.filter(log => log.level === 'error').length;
  }

  // Принудительное обновление данных
  refresh() {
    if (typeof window !== 'undefined') {
      // Очищаем кэш и перезагружаем данные
      const event = new CustomEvent('monitoring-refresh');
      window.dispatchEvent(event);
    }
  }
}

// Singleton instance
export const monitor = new ProductionMonitor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.productionMonitor = monitor;
  
  // Global debugging functions
  window.carlynxLogs = () => {
    const logs = monitor.exportLocalLogs();
    const errors = logs.filter(log => log.level === 'error');
    const warnings = logs.filter(log => log.level === 'warn');
    
    return {
      all: logs,
      errors,
      warnings,
      count: {
        total: logs.length,
        errors: errors.length,
        warnings: warnings.length,
        info: logs.filter(log => log.level === 'info').length,
        debug: logs.filter(log => log.level === 'debug').length
      },
      ui: () => {
        console.log('🔍 CARLYNX MONITORING DASHBOARD');
        console.log('=' .repeat(50));
        console.log(`📊 Total logs: ${logs.length}`);
        console.log(`❌ Errors: ${errors.length}`);
        console.log(`⚠️  Warnings: ${warnings.length}`);
        
        if (errors.length > 0) {
          console.log('\n🚨 ERRORS:');
          errors.forEach((error, i) => {
            console.log(`${i + 1}. [${new Date(error.timestamp).toLocaleString()}] ${error.event}`);
            console.log('   Message:', error.data);
          });
        }
        
        if (warnings.length > 0) {
          console.log('\n⚠️  WARNINGS:');
          warnings.slice(-5).forEach((warning, i) => {
            console.log(`${i + 1}. [${new Date(warning.timestamp).toLocaleString()}] ${warning.event}`);
            console.log('   Data:', warning.data);
          });
        }
        
        console.log('\n🔧 AVAILABLE COMMANDS:');
        console.log('carlynxLogs().all        - All logs');
        console.log('carlynxLogs().errors     - Error logs only');
        console.log('productionMonitor.clearLogs() - Clear all logs');
        console.log('productionMonitor.refresh()   - Refresh monitoring');
      }
    };
  };
}

// Convenience methods
export const logInfo = (event: string, data?: unknown) => monitor.log('info', event, data);
export const logWarn = (event: string, data?: unknown) => monitor.log('warn', event, data);
export const logError = (event: string, data?: unknown) => monitor.log('error', event, data);
export const logDebug = (event: string, data?: unknown) => monitor.log('debug', event, data);