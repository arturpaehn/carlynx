// Утилиты для работы с кешем

// Генерирует уникальный cache-busting параметр
export function getCacheBuster(): string {
  return `v=${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Добавляет cache-busting параметр к URL
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${getCacheBuster()}`
}

// Очищает localStorage и sessionStorage для принудительной очистки кеша
export function clearClientCache(): void {
  if (typeof window !== 'undefined') {
    try {
      // Очищаем localStorage
      localStorage.clear()
      // Очищаем sessionStorage
      sessionStorage.clear()
      // Принудительно перезагружаем
      window.location.reload()
    } catch (error) {
      console.warn('Cache clearing failed:', error)
    }
  }
}

// Принудительно обновляет страницу с очисткой кеша
export function forceRefresh(): void {
  if (typeof window !== 'undefined') {
    // Добавляем случайный параметр для обхода кеша
    const currentUrl = window.location.href
    const separator = currentUrl.includes('?') ? '&' : '?'
    const newUrl = `${currentUrl}${separator}${getCacheBuster()}`
    
    // Обновляем URL и перезагружаем
    window.location.replace(newUrl)
  }
}
