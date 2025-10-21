// Clear all monitoring logs and reset state
// Run this in Chrome DevTools Console

console.log("🧹 CLEARING MONITORING LOGS");
console.log("=" .repeat(40));

// Clear localStorage
localStorage.removeItem('carlynx_monitoring_logs');
localStorage.removeItem('carlynx_monitoring_last_update');
localStorage.removeItem('carlynx_logs'); // Old key

console.log("✅ Cleared localStorage monitoring data");

// Force reload to reinitialize monitoring
console.log("🔄 Please refresh the page to reinitialize monitoring system");
console.log("");
console.log("After refresh, you should be able to run:");
console.log("- carlynxLogs().ui          (for monitoring dashboard)");
console.log("- productionMonitor.refresh() (to refresh data)");