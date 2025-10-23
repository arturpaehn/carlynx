// Cache management utilities

// Generates unique cache-busting parameter
export function getCacheBuster(): string {
  return `v=${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Adds cache-busting parameter to URL
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${getCacheBuster()}`
}

// Clears localStorage and sessionStorage for forced cache clearing
export function clearClientCache(): void {
  if (typeof window !== 'undefined') {
    try {
      // Save only critical data
      const language = localStorage.getItem('language');
      const cookieConsent = localStorage.getItem('cookie-consent');
      
      // Clear all localStorage and sessionStorage
      localStorage.clear()
      sessionStorage.clear()
      
      // Restore important settings
      if (language) {
        localStorage.setItem('language', language);
      }
      if (cookieConsent) {
        localStorage.setItem('cookie-consent', cookieConsent);
      }
      
      console.log('✅ Client cache cleared, language and consent preserved');
      
      // Force reload
      window.location.reload()
    } catch (error) {
      console.warn('Cache clearing failed:', error)
    }
  }
}

// NEW FUNCTION: Checks if there is stale data in cache
export function checkCacheValidation(): boolean {
  if (typeof window === 'undefined') return true;
  
  try {
    // Check last monitoring update
    const lastUpdate = localStorage.getItem('carlynx_monitoring_last_update');
    if (lastUpdate) {
      const lastUpdateTime = parseInt(lastUpdate);
      const hoursAgo = (Date.now() - lastUpdateTime) / (1000 * 60 * 60);
      
      // If data is older than 12 hours - might be stale
      if (hoursAgo > 12) {
        console.warn('⚠️ Cache may be stale - data is', Math.round(hoursAgo), 'hours old');
        return false;
      }
    }
    return true;
  } catch {
    return true; // If we can't check - consider valid
  }
}

// Force page refresh with cache clearing
export function forceRefresh(): void {
  if (typeof window !== 'undefined') {
    // Add random parameter to bypass cache
    const currentUrl = window.location.href
    const separator = currentUrl.includes('?') ? '&' : '?'
    const newUrl = `${currentUrl}${separator}${getCacheBuster()}`
    
    // Update URL and reload
    window.location.replace(newUrl)
  }
}
