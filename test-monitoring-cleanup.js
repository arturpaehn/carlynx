// Test script to verify monitoring cleanup works
// Run this in browser console at http://localhost:3000

console.log('🧪 Testing Monitoring Cleanup...\n');

// 1. Check current logs
const currentLogs = localStorage.getItem('carlynx_monitoring_logs');
if (currentLogs) {
  const parsed = JSON.parse(currentLogs);
  console.log(`📊 Current logs: ${parsed.length}`);
  
  const errors = parsed.filter(log => log.level === 'error');
  const warnings = parsed.filter(log => log.level === 'warn');
  
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  
  // Show oldest log
  if (parsed.length > 0) {
    const oldest = parsed.reduce((prev, curr) => 
      prev.timestamp < curr.timestamp ? prev : curr
    );
    const oldestDate = new Date(oldest.timestamp);
    console.log(`\n📅 Oldest log: ${oldestDate.toLocaleString()}`);
    console.log(`   Age: ${((Date.now() - oldest.timestamp) / (1000 * 60 * 60)).toFixed(1)} hours`);
  }
} else {
  console.log('✅ No logs found - storage is clean!');
}

console.log('\n🔧 Available commands:');
console.log('carlynxLogs().ui()           - Show monitoring dashboard');
console.log('productionMonitor.clearLogs() - Clear all logs manually');
console.log('location.reload()            - Reload to trigger auto-cleanup');

console.log('\n💡 Tip: Refresh the page to see auto-cleanup in action!');
console.log('    Old logs (>24h) will be automatically removed.');
