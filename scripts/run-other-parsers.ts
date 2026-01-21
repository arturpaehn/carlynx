#!/usr/bin/env ts-node

/**
 * Run other parsers (non-AutoNation)
 * Scheduled to run at 15:00 UTC in GitHub Actions
 * 7 parsers: Mars, Auto Boutique, Pre-owned, Auto Center, Dream Machines, Philpott Ford, Right Drive
 */

import { syncMarsDealer } from './parsers/marsDealershipParser';
import { syncAutoBoutique } from './parsers/autoBoutiqueParser';
import { syncPreOwnedPlus } from './parsers/preOwnedPlusParser';
import { syncAutoCenterTexas } from './parsers/autoCenterTexasParser';
import { syncDreamMachines } from './parsers/dreamMachinesParser';
import { syncPhilpottFord } from './parsers/philpottFordParser';
import { syncRightDrive } from './parsers/rightDriveParser';

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

async function runOtherParsers() {
  // Set a 15-minute timeout for other parsers job
  const TOTAL_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  const PER_PARSER_TIMEOUT = 3 * 60 * 1000; // 3 minutes per parser

  const timeoutHandle = setTimeout(() => {
    console.error('\n💥 FATAL: Total operation timeout (15 minutes) exceeded!');
    console.error('Some parsers did not complete in time.');
    process.exit(1);
  }, TOTAL_TIMEOUT);

  console.log('🚀 Starting other parsers sync...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Total timeout: ${TOTAL_TIMEOUT / 60000} minutes`);
  console.log(`⏱️  Per-parser timeout: ${PER_PARSER_TIMEOUT / 60000} minutes`);
  console.log('='.repeat(60));

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}`);
    console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${!!supabaseKey}`);
    process.exit(1);
  }

  console.log('✅ Supabase credentials found');
  console.log('='.repeat(60));

  const results = {
    marsDealer: { success: false, error: null as string | null },
    autoBoutique: { success: false, error: null as string | null },
    preOwnedPlus: { success: false, error: null as string | null },
    autoCenterTexas: { success: false, error: null as string | null },
    dreamMachines: { success: false, error: null as string | null },
    philpottFord: { success: false, error: null as string | null },
    rightDrive: { success: false, error: null as string | null }
  };

  // 1. Mars Dealership
  try {
    console.log('\n🚗 [1/7] Mars Dealership...');
    await withTimeout(syncMarsDealer(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Mars Dealership');
    results.marsDealer.success = true;
    console.log('✅ Mars Dealership completed');
  } catch (error) {
    results.marsDealer.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Mars Dealership failed:', error);
  }

  // 2. Auto Boutique Texas
  try {
    console.log('\n🚗 [2/7] Auto Boutique Texas...');
    await withTimeout(syncAutoBoutique(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Auto Boutique');
    results.autoBoutique.success = true;
    console.log('✅ Auto Boutique Texas completed');
  } catch (error) {
    results.autoBoutique.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto Boutique Texas failed:', error);
  }

  // 3. Pre-owned Plus (Puppeteer)
  try {
    console.log('\n🚗 [3/7] Pre-owned Plus...');
    await withTimeout(syncPreOwnedPlus(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Pre-owned Plus');
    results.preOwnedPlus.success = true;
    console.log('✅ Pre-owned Plus completed');
  } catch (error) {
    results.preOwnedPlus.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Pre-owned Plus failed:', error);
  }

  // 4. Auto Center of Texas
  try {
    console.log('\n🚗 [4/7] Auto Center of Texas...');
    await withTimeout(syncAutoCenterTexas(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Auto Center Texas');
    results.autoCenterTexas.success = true;
    console.log('✅ Auto Center of Texas completed');
  } catch (error) {
    results.autoCenterTexas.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto Center of Texas failed:', error);
  }

  // 5. Dream Machines of Texas (Motorcycles)
  try {
    console.log('\n🏍️  [5/7] Dream Machines of Texas...');
    await withTimeout(syncDreamMachines(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Dream Machines');
    results.dreamMachines.success = true;
    console.log('✅ Dream Machines of Texas completed');
  } catch (error) {
    results.dreamMachines.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Dream Machines of Texas failed:', error);
  }

  // 6. Philpott Ford
  try {
    console.log('\n🚗 [6/7] Philpott Ford...');
    await withTimeout(syncPhilpottFord(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Philpott Ford');
    results.philpottFord.success = true;
    console.log('✅ Philpott Ford completed');
  } catch (error) {
    results.philpottFord.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Philpott Ford failed:', error);
  }

  // 7. Right Drive Auto (El Paso)
  try {
    console.log('\n🚗 [7/7] Right Drive Auto...');
    await withTimeout(syncRightDrive(), PER_PARSER_TIMEOUT, 'Right Drive Auto');
    results.rightDrive.success = true;
    console.log('✅ Right Drive Auto completed');
  } catch (error) {
    results.rightDrive.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Right Drive Auto failed:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY - Other Parsers');
  console.log('='.repeat(60));
  console.log(`Mars Dealership:         ${results.marsDealer.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Auto Boutique Texas:     ${results.autoBoutique.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Pre-owned Plus:          ${results.preOwnedPlus.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Auto Center of Texas:    ${results.autoCenterTexas.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Dream Machines TX:       ${results.dreamMachines.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Philpott Ford:           ${results.philpottFord.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Right Drive Auto:        ${results.rightDrive.success ? '✅ Success' : '❌ Failed'}`);
  console.log('='.repeat(60));

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n🎉 Completed: ${successCount}/7 parsers successful`);

  // Exit with error if any parser failed
  if (successCount < 7) {
    console.error('\n⚠️  Some parsers failed - check logs above');
    clearTimeout(timeoutHandle);
    process.exit(1);
  }

  console.log('\n✅ All other parsers completed successfully!');
  clearTimeout(timeoutHandle);
  process.exit(0);
}

// Run
runOtherParsers().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
