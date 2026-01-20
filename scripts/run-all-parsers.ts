#!/usr/bin/env ts-node

/**
 * Run all external listing parsers sequentially
 * Used by GitHub Actions for scheduled sync
 */

import { syncMarsDealer } from './parsers/marsDealershipParser';
import { syncAutoBoutique } from './parsers/autoBoutiqueParser';
import { syncPreOwnedPlus } from './parsers/preOwnedPlusParser';
import { syncAutoCenterTexas } from './parsers/autoCenterTexasParser';
import { syncDreamMachines } from './parsers/dreamMachinesParser';
import { syncPhilpottFord } from './parsers/philpottFordParser';
import { syncRightDrive } from './parsers/rightDriveParser';
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

async function runAllParsers() {
  // Set a 25-minute timeout for the entire operation (5 minutes buffer before GitHub Actions 30-min step timeout)
  const TOTAL_TIMEOUT = 25 * 60 * 1000; // 25 minutes
  const PER_PARSER_TIMEOUT = 3 * 60 * 1000; // 3 minutes per parser
  
  const timeoutHandle = setTimeout(() => {
    console.error('\n💥 FATAL: Total operation timeout (25 minutes) exceeded!');
    console.error('Some parsers did not complete in time.');
    process.exit(1);
  }, TOTAL_TIMEOUT);

  console.log('🚀 Starting all parsers sync...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Total timeout: ${TOTAL_TIMEOUT / 60000} minutes`);
  console.log(`⏱️  Per-parser timeout: ${PER_PARSER_TIMEOUT / 60000} minutes`);
  console.log('='.repeat(60));
  
  const results = {
    marsDealer: { success: false, error: null as string | null },
    autoBoutique: { success: false, error: null as string | null },
    preOwnedPlus: { success: false, error: null as string | null },
    autoCenterTexas: { success: false, error: null as string | null },
    dreamMachines: { success: false, error: null as string | null },
    philpottFord: { success: false, error: null as string | null },
    rightDrive: { success: false, error: null as string | null },
    autoNationUsaCorpusChristi: { success: false, error: null as string | null },
    autoNationUsaAustin: { success: false, error: null as string | null },
    autoNationUsaHouston: { success: false, error: null as string | null },
    autoNationUsaKaty: { success: false, error: null as string | null }
  };

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

  // 1. Mars Dealership
  try {
    console.log('\n🚗 [1/6] Mars Dealership...');
    await withTimeout(syncMarsDealer(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Mars Dealership');
    results.marsDealer.success = true;
    console.log('✅ Mars Dealership completed');
  } catch (error) {
    results.marsDealer.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Mars Dealership failed:', error);
  }

  // 2. Auto Boutique Texas
  try {
    console.log('\n🚗 [2/6] Auto Boutique Texas...');
    await withTimeout(syncAutoBoutique(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Auto Boutique');
    results.autoBoutique.success = true;
    console.log('✅ Auto Boutique Texas completed');
  } catch (error) {
    results.autoBoutique.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto Boutique Texas failed:', error);
  }

  // 3. Pre-owned Plus (Puppeteer)
  try {
    console.log('\n🚗 [3/5] Pre-owned Plus...');
    await withTimeout(syncPreOwnedPlus(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Pre-owned Plus');
    results.preOwnedPlus.success = true;
    console.log('✅ Pre-owned Plus completed');
  } catch (error) {
    results.preOwnedPlus.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Pre-owned Plus failed:', error);
  }

  // 4. Auto Center of Texas
  try {
    console.log('\n🚗 [4/5] Auto Center of Texas...');
    await withTimeout(syncAutoCenterTexas(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Auto Center Texas');
    results.autoCenterTexas.success = true;
    console.log('✅ Auto Center of Texas completed');
  } catch (error) {
    results.autoCenterTexas.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto Center of Texas failed:', error);
  }

  // 5. Dream Machines of Texas (Motorcycles)
  try {
    console.log('\n🏍️  [5/8] Dream Machines of Texas...');
    await withTimeout(syncDreamMachines(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Dream Machines');
    results.dreamMachines.success = true;
    console.log('✅ Dream Machines of Texas completed');
  } catch (error) {
    results.dreamMachines.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Dream Machines of Texas failed:', error);
  }

  // 6. Philpott Ford
  try {
    console.log('\n🚗 [6/8] Philpott Ford...');
    await withTimeout(syncPhilpottFord(supabaseUrl, supabaseKey), PER_PARSER_TIMEOUT, 'Philpott Ford');
    results.philpottFord.success = true;
    console.log('✅ Philpott Ford completed');
  } catch (error) {
    results.philpottFord.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Philpott Ford failed:', error);
  }

  // 7. Right Drive Auto (El Paso)
  try {
    console.log('\n🚗 [7/8] Right Drive Auto...');
    await withTimeout(syncRightDrive(), PER_PARSER_TIMEOUT, 'Right Drive Auto');
    results.rightDrive.success = true;
    console.log('✅ Right Drive Auto completed');
  } catch (error) {
    results.rightDrive.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Right Drive Auto failed:', error);
  }

  // 8. AutoNation USA Corpus Christi
  try {
    console.log('\n🚗 [8/9] AutoNation USA Corpus Christi...');
    await withTimeout(syncAutoNationUsaCorpusChristi(), PER_PARSER_TIMEOUT, 'AutoNation Corpus Christi');
    results.autoNationUsaCorpusChristi.success = true;
    console.log('✅ AutoNation USA Corpus Christi completed');
  } catch (error) {
    results.autoNationUsaCorpusChristi.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Corpus Christi failed:', error);
  }

  // 9. AutoNation USA Austin
  try {
    console.log('\n🚗 [9/10] AutoNation USA Austin...');
    await withTimeout(syncAutoNationUsaAustin(), PER_PARSER_TIMEOUT, 'AutoNation Austin');
    results.autoNationUsaAustin.success = true;
    console.log('✅ AutoNation USA Austin completed');
  } catch (error) {
    results.autoNationUsaAustin.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Austin failed:', error);
  }

  // 10. AutoNation USA Houston
  try {
    console.log('\n🚗 [10/11] AutoNation USA Houston...');
    await withTimeout(syncAutoNationUsaHouston(), PER_PARSER_TIMEOUT, 'AutoNation Houston');
    results.autoNationUsaHouston.success = true;
    console.log('✅ AutoNation USA Houston completed');
  } catch (error) {
    results.autoNationUsaHouston.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Houston failed:', error);
  }

  // 11. AutoNation USA Katy
  try {
    console.log('\n🚗 [11/11] AutoNation USA Katy...');
    await withTimeout(syncAutoNationUsaKaty(), PER_PARSER_TIMEOUT, 'AutoNation Katy');
    results.autoNationUsaKaty.success = true;
    console.log('✅ AutoNation USA Katy completed');
  } catch (error) {
    results.autoNationUsaKaty.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Katy failed:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Mars Dealership:         ${results.marsDealer.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Auto Boutique Texas:     ${results.autoBoutique.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Pre-owned Plus:          ${results.preOwnedPlus.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Auto Center of Texas:    ${results.autoCenterTexas.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Dream Machines TX:       ${results.dreamMachines.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Philpott Ford:           ${results.philpottFord.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Right Drive Auto:        ${results.rightDrive.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`AutoNation USA CC:       ${results.autoNationUsaCorpusChristi.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`AutoNation USA Austin:   ${results.autoNationUsaAustin.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`AutoNation USA Houston:  ${results.autoNationUsaHouston.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`AutoNation USA Katy:     ${results.autoNationUsaKaty.success ? '✅ Success' : '❌ Failed'}`);
  console.log('='.repeat(60));

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n🎉 Completed: ${successCount}/11 parsers successful`);

  // Exit with error if any parser failed
  if (successCount < 11) {
    console.error('\n⚠️  Some parsers failed - check logs above');
    clearTimeout(timeoutHandle);
    process.exit(1);
  }

  console.log('\n✅ All parsers completed successfully!');
  clearTimeout(timeoutHandle);
  process.exit(0);
}

// Run
runAllParsers().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
