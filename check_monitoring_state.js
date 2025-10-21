// Copy and paste this into Chrome DevTools Console to check monitoring system state

console.log("🔍 MONITORING SYSTEM STATE CHECK");
console.log("=" .repeat(50));

// Check if ProductionMonitor exists in memory
if (typeof window.productionMonitor !== 'undefined') {
    console.log("✅ ProductionMonitor found in memory");
    
    // Check in-memory error count
    const monitor = window.productionMonitor;
    console.log("In-memory error count:", monitor.getErrorCount ? monitor.getErrorCount() : "Method not available");
    
    // Check recent logs in memory
    if (monitor.getLogs) {
        const recentLogs = monitor.getLogs();
        const memoryErrors = recentLogs.filter(log => log.level === 'error');
        console.log("Errors in memory:", memoryErrors.length);
        
        if (memoryErrors.length > 0) {
            console.log("Memory errors details:");
            memoryErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.message}`, error);
            });
        }
    }
} else {
    console.log("❌ ProductionMonitor not found in window object");
}

// Check localStorage vs memory sync
const localStorageLogs = JSON.parse(localStorage.getItem('carlynx_monitoring_logs') || '[]');
const localStorageErrors = localStorageLogs.filter(log => log.level === 'error');

console.log("LocalStorage errors:", localStorageErrors.length);
console.log("Last localStorage update:", localStorage.getItem('carlynx_monitoring_last_update'));

// Check if there are any global error handlers
console.log("Global error handlers:");
console.log("window.onerror:", typeof window.onerror);
console.log("window.onunhandledrejection:", typeof window.onunhandledrejection);

// Check if monitoring UI component exists
const monitoringElements = document.querySelectorAll('[class*="monitor"], [class*="error"], [id*="monitor"]');
console.log("Monitoring UI elements found:", monitoringElements.length);

// Try to force refresh monitoring data
if (typeof window.productionMonitor !== 'undefined' && window.productionMonitor.refresh) {
    console.log("🔄 Attempting to refresh monitoring data...");
    window.productionMonitor.refresh();
}