#!/usr/bin/env ts-node

/**
 * Run all external listing parsers sequentially
 * Used by GitHub Actions for scheduled sync
 */

import { syncMarsDealer } from './parsers/marsDealershipParser';
import { syncAutoBoutique } from './parsers/autoBoutiqueParser';
import { syncPreOwnedPlus } from './parsers/preOwnedPlusParser';
import { syncLeifJohnson } from './parsers/leifJohnsonParser';
import { syncAutoCenterTexas } from './parsers/autoCenterTexasParser';
import { syncDreamMachines } from './parsers/dreamMachinesParser';
import { syncPhilpottFord } from './parsers/philpottFordParser';
import { syncRightDrive } from './parsers/rightDriveParser';
import { syncAutoNationUsaCorpusChristi } from './parsers/autoNationUsaCorpusChristiParser';

async function runAllParsers() {
  console.log('🚀 Starting all parsers sync...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  const results = {
    marsDealer: { success: false, error: null as string | null },
    autoBoutique: { success: false, error: null as string | null },
    preOwnedPlus: { success: false, error: null as string | null },
    leifJohnson: { success: false, error: null as string | null },
    autoCenterTexas: { success: false, error: null as string | null },
    dreamMachines: { success: false, error: null as string | null },
    philpottFord: { success: false, error: null as string | null },
    rightDrive: { success: false, error: null as string | null },
    autoNationUsaCorpusChristi: { success: false, error: null as string | null }
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
    await syncMarsDealer(supabaseUrl, supabaseKey);
    results.marsDealer.success = true;
    console.log('✅ Mars Dealership completed');
  } catch (error) {
    results.marsDealer.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Mars Dealership failed:', error);
  }

  // 2. Auto Boutique Texas
  try {
    console.log('\n🚗 [2/6] Auto Boutique Texas...');
    await syncAutoBoutique(supabaseUrl, supabaseKey);
    results.autoBoutique.success = true;
    console.log('✅ Auto Boutique Texas completed');
  } catch (error) {
    results.autoBoutique.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto Boutique Texas failed:', error);
  }

  // 3. Pre-owned Plus (Puppeteer)
  try {
    console.log('\n🚗 [3/6] Pre-owned Plus...');
    await syncPreOwnedPlus(supabaseUrl, supabaseKey);
    results.preOwnedPlus.success = true;
    console.log('✅ Pre-owned Plus completed');
  } catch (error) {
    results.preOwnedPlus.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Pre-owned Plus failed:', error);
  }

  // 4. Leif Johnson (Puppeteer)
  try {
    console.log('\n🚗 [4/6] Leif Johnson...');
    await syncLeifJohnson(supabaseUrl, supabaseKey);
    results.leifJohnson.success = true;
    console.log('✅ Leif Johnson completed');
  } catch (error) {
    results.leifJohnson.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Leif Johnson failed:', error);
  }

  // 5. Auto Center of Texas
  try {
    console.log('\n🚗 [5/6] Auto Center of Texas...');
    await syncAutoCenterTexas(supabaseUrl, supabaseKey);
    results.autoCenterTexas.success = true;
    console.log('✅ Auto Center of Texas completed');
  } catch (error) {
    results.autoCenterTexas.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto Center of Texas failed:', error);
  }

  // 6. Dream Machines of Texas (Motorcycles)
  try {
    console.log('\n🏍️  [6/9] Dream Machines of Texas...');
    await syncDreamMachines(supabaseUrl, supabaseKey);
    results.dreamMachines.success = true;
    console.log('✅ Dream Machines of Texas completed');
  } catch (error) {
    results.dreamMachines.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Dream Machines of Texas failed:', error);
  }

  // 7. Philpott Ford
  try {
    console.log('\n🚗 [7/9] Philpott Ford...');
    await syncPhilpottFord(supabaseUrl, supabaseKey);
    results.philpottFord.success = true;
    console.log('✅ Philpott Ford completed');
  } catch (error) {
    results.philpottFord.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Philpott Ford failed:', error);
  }

  // 8. Right Drive Auto (El Paso)
  try {
    console.log('\n🚗 [8/9] Right Drive Auto...');
    await syncRightDrive();
    results.rightDrive.success = true;
    console.log('✅ Right Drive Auto completed');
  } catch (error) {
    results.rightDrive.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Right Drive Auto failed:', error);
  }

  // 9. AutoNation USA Corpus Christi
  try {
    console.log('\n🚗 [9/9] AutoNation USA Corpus Christi...');
    await syncAutoNationUsaCorpusChristi();
    results.autoNationUsaCorpusChristi.success = true;
    console.log('✅ AutoNation USA Corpus Christi completed');
  } catch (error) {
    results.autoNationUsaCorpusChristi.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ AutoNation USA Corpus Christi failed:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Mars Dealership:         ${results.marsDealer.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Auto Boutique Texas:     ${results.autoBoutique.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Pre-owned Plus:          ${results.preOwnedPlus.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Leif Johnson:            ${results.leifJohnson.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Auto Center of Texas:    ${results.autoCenterTexas.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Dream Machines TX:       ${results.dreamMachines.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Philpott Ford:           ${results.philpottFord.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Right Drive Auto:        ${results.rightDrive.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`AutoNation USA CC:       ${results.autoNationUsaCorpusChristi.success ? '✅ Success' : '❌ Failed'}`);
  console.log('='.repeat(60));

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n🎉 Completed: ${successCount}/9 parsers successful`);

  // Exit with error if any parser failed
  if (successCount < 9) {
    console.error('\n⚠️  Some parsers failed - check logs above');
    process.exit(1);
  }

  console.log('\n✅ All parsers completed successfully!');
  process.exit(0);
}

// Run
runAllParsers().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
