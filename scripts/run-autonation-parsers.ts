#!/usr/bin/env ts-node

/**
 * Run AutoNation USA parsers only
 * Scheduled to run at 14:00 UTC in GitHub Actions
 * 4 parsers: Houston, Katy, Austin, Corpus Christi
 */

import { syncAutoNationUsaCorpusChristi } from './parsers/autoNationUsaCorpusChristiParser';
import { syncAutoNationUsaAustin } from './parsers/autoNationUsaAustinParser';
import { syncAutoNationUsaHouston } from './parsers/autoNationUsaHoustonParser';
import { syncAutoNationUsaKaty } from './parsers/autoNationUsaKatyParser';

/**
 * Wrap a parser function with a per-parser timeout
 * Each parser has a maximum of 3 minutes
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  parserName: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Parser timeout: ${parserName} exceeded ${timeoutMs / 1000}s`)),
        timeoutMs
      )
    )
  ]);
}

async function runAutoNationParsers() {
  // Set a 20-minute timeout for AutoNation job
  const TOTAL_TIMEOUT = 20 * 60 * 1000; // 20 minutes
  const PER_PARSER_TIMEOUT = 5 * 60 * 1000; // 5 minutes per parser (with parallel detail fetching)

  const timeoutHandle = setTimeout(() => {
    console.error('\n💥 FATAL: Total operation timeout (20 minutes) exceeded!');
    console.error('Some parsers did not complete in time.');
    process.exit(1);
  }, TOTAL_TIMEOUT);

  console.log('🚀 Starting AutoNation USA parsers sync...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Total timeout: ${TOTAL_TIMEOUT / 60000} minutes`);
  console.log(`⏱️  Per-parser timeout: ${PER_PARSER_TIMEOUT / 60000} minutes`);
  console.log('='.repeat(60));

  const results = {
    autoNationUsaCorpusChristi: { success: false, error: null as string | null },
    autoNationUsaAustin: { success: false, error: null as string | null },
    autoNationUsaHouston: { success: false, error: null as string | null },
    autoNationUsaKaty: { success: false, error: null as string | null }
  };

  // 1. AutoNation USA Corpus Christi
  try {
    console.log('\n🚗 [1/4] AutoNation USA Corpus Christi...');
    await withTimeout(syncAutoNationUsaCorpusChristi(), PER_PARSER_TIMEOUT, 'AutoNation Corpus Christi');
    results.autoNationUsaCorpusChristi.success = true;
    console.log('✅ AutoNation USA Corpus Christi completed');
  } catch (error) {
    results.autoNationUsaCorpusChristi.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Corpus Christi failed:', error);
  }

  // 2. AutoNation USA Austin
  try {
    console.log('\n🚗 [2/4] AutoNation USA Austin...');
    await withTimeout(syncAutoNationUsaAustin(), PER_PARSER_TIMEOUT, 'AutoNation Austin');
    results.autoNationUsaAustin.success = true;
    console.log('✅ AutoNation USA Austin completed');
  } catch (error) {
    results.autoNationUsaAustin.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Austin failed:', error);
  }

  // 3. AutoNation USA Houston
  try {
    console.log('\n🚗 [3/4] AutoNation USA Houston...');
    await withTimeout(syncAutoNationUsaHouston(), PER_PARSER_TIMEOUT, 'AutoNation Houston');
    results.autoNationUsaHouston.success = true;
    console.log('✅ AutoNation USA Houston completed');
  } catch (error) {
    results.autoNationUsaHouston.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Houston failed:', error);
  }

  // 4. AutoNation USA Katy
  try {
    console.log('\n🚗 [4/4] AutoNation USA Katy...');
    await withTimeout(syncAutoNationUsaKaty(), PER_PARSER_TIMEOUT, 'AutoNation Katy');
    results.autoNationUsaKaty.success = true;
    console.log('✅ AutoNation USA Katy completed');
  } catch (error) {
    results.autoNationUsaKaty.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Katy failed:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY - AutoNation USA Parsers');
  console.log('='.repeat(60));
  console.log(`AutoNation USA CC:       ${results.autoNationUsaCorpusChristi.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`AutoNation USA Austin:   ${results.autoNationUsaAustin.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`AutoNation USA Houston:  ${results.autoNationUsaHouston.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`AutoNation USA Katy:     ${results.autoNationUsaKaty.success ? '✅ Success' : '❌ Failed'}`);
  console.log('='.repeat(60));

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n🎉 Completed: ${successCount}/4 parsers successful`);

  // Exit with error if any parser failed
  if (successCount < 4) {
    console.error('\n⚠️  Some parsers failed - check logs above');
    clearTimeout(timeoutHandle);
    process.exit(1);
  }

  console.log('\n✅ All AutoNation USA parsers completed successfully!');
  clearTimeout(timeoutHandle);
  process.exit(0);
}

// Run
runAutoNationParsers().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
