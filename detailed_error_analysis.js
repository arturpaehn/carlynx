// Copy and paste this into Chrome DevTools Console for detailed error analysis

console.log("🔍 DETAILED ERROR ANALYSIS");
console.log("=" .repeat(50));

// Get all errors with full details
const allLogs = JSON.parse(localStorage.getItem('carlynx_monitoring_logs') || '[]');
const errors = allLogs.filter(log => log.level === 'error');

console.log(`📊 Total errors found: ${errors.length}`);
console.log("");

errors.forEach((error, index) => {
    console.log(`🚨 ERROR ${index + 1}:`);
    console.log("Timestamp:", new Date(error.timestamp).toLocaleString());
    console.log("Message:", error.message);
    console.log("Data:", error.data);
    console.log("User Agent:", error.userAgent);
    console.log("URL:", error.url);
    console.log("Session ID:", error.sessionId);
    console.log("-".repeat(40));
});

// Also check for recent warnings that might be related
const warnings = allLogs.filter(log => log.level === 'warn').slice(-5);
if (warnings.length > 0) {
    console.log("");
    console.log("⚠️ RECENT WARNINGS (last 5):");
    warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`, warning.data);
    });
}

// Check for specific error patterns
console.log("");
console.log("🔍 ERROR PATTERN ANALYSIS:");
const errorMessages = errors.map(e => e.message);
const uniqueMessages = [...new Set(errorMessages)];
console.log("Unique error messages:", uniqueMessages);

// Check if errors are related to specific components
const errorSources = errors.map(e => {
    if (e.data && e.data.stack) {
        return e.data.stack.split('\n')[0];
    }
    return 'Unknown source';
});
console.log("Error sources:", [...new Set(errorSources)]);