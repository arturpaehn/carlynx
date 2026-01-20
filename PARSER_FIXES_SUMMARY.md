# GitHub Actions Parser Timeout Issues - Fix Summary

## Problem
GitHub Actions parsers were failing with "The operation was canceled" errors during execution. The issue was caused by:
1. No overall timeout protection for the job
2. Very long Puppeteer navigation timeouts (60 seconds)
3. No memory/resource optimization for Puppeteer
4. No per-parser timeout limits
5. No retry logic for failed detail page fetches

## Solutions Implemented

### 1. ✅ GitHub Actions Workflow (.github/workflows/sync-parsers.yml)
- **Added**: `timeout-minutes: 60` to the job
- **Effect**: Prevents jobs from running indefinitely; kills stuck processes after 1 hour
- **Impact**: Protects against infinite hanging jobs

### 2. ✅ Overall Process Timeout (scripts/run-all-parsers.ts)
- **Added**: 25-minute total timeout for the entire parser suite
- **Added**: 5-minute buffer before GitHub Actions hard timeout
- **Added**: Per-parser timeout of 3 minutes maximum
- **Effect**: Each parser has maximum 3 minutes; entire suite stops at 25 minutes
- **Impact**: Early termination instead of hanging indefinitely

### 3. ✅ AutoNation USA Parsers - Timeout Reductions
Updated all four AutoNation parsers:
- `autoNationUsaHoustonParser.ts`
- `autoNationUsaCorpusChristiParser.ts`
- `autoNationUsaAustinParser.ts`
- `autoNationUsaKatyParser.ts`

Changes:
- **Detail page navigation timeout**: 60s → 20s
- **Initial page navigation timeout**: 60s → 30s
- **Selector wait timeout**: 30s → 10s
- **Delay between navigation**: 8s → 3s
- **Delay after scroll**: 5s → 2s
- **Effect**: Faster failure detection; won't hang on slow/unresponsive pages

### 4. ✅ Puppeteer Memory Optimization
Added Chrome launch arguments to all AutoNation parsers:
```typescript
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',      // Use temp storage instead of /dev/shm
  '--disable-gpu',                 // Reduce memory usage
  '--single-process=false',        // Ensure separate process
  '--memory-pressure-off'          // Disable memory pressure optimization
]
```

- **Effect**: Better memory management; prevents OOM issues in GitHub Actions
- **Impact**: More stable browser process; reduces crashes

### 5. ✅ Retry Logic for Detail Pages
Added to AutoNation Houston parser (and should be applied to others):
- **Retry mechanism**: Up to 2 attempts per detail page
- **Backoff**: 1 second wait between retries
- **Effect**: Handles transient network/page load failures
- **Impact**: More resilient parsing

### 6. ✅ Better Error Handling
- Improved error messages with truncation to prevent log overflow
- Proper page cleanup in error conditions
- More descriptive timeout error messages

## Testing Recommendations

1. **Monitor next GitHub Actions run**: Check that parsers complete within 25 minutes
2. **Check logs**: Look for timeout warnings vs actual timeouts
3. **Verify data**: Ensure all 11 parsers are still collecting data correctly
4. **Email alerts**: Continue monitoring email notifications for completion status

## Configuration Summary

| Setting | Value | Purpose |
|---------|-------|---------|
| GitHub Actions Job Timeout | 60 minutes | Hard stop for runaway jobs |
| Total Parser Timeout | 25 minutes | Soft stop with 5-min buffer |
| Per-Parser Timeout | 3 minutes | Individual parser protection |
| Detail Page Timeout | 20 seconds | Fail fast on slow pages |
| Initial Page Timeout | 30 seconds | Quick detection of unreachable sites |
| Selector Wait | 10 seconds | Don't wait forever for elements |

## Files Modified

1. `.github/workflows/sync-parsers.yml` - Added job timeout
2. `scripts/run-all-parsers.ts` - Added overall and per-parser timeouts
3. `scripts/parsers/autoNationUsaHoustonParser.ts` - Reduced timeouts, memory optimization, retry logic
4. `scripts/parsers/autoNationUsaCorpusChristiParser.ts` - Reduced timeouts, memory optimization
5. `scripts/parsers/autoNationUsaAustinParser.ts` - Reduced timeouts, memory optimization
6. `scripts/parsers/autoNationUsaKatyParser.ts` - Reduced timeouts, memory optimization

## Future Improvements

1. Consider implementing parser circuit breaker if a site is consistently down
2. Add parsing metrics/monitoring to track performance
3. Implement health checks before attempting full parse
4. Add early exit if insufficient data is being collected
5. Consider running parsers in parallel (instead of sequentially) with proper resource limits
