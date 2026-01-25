#!/usr/bin/env ts-node

/**
 * Run Other Vendors Batch 2
 * Scheduled to run at 06:30 UTC in GitHub Actions
 * Parsers: Dream Machines, Mars Dealership, Philpott Ford
 */

import { syncDreamMachines } from './parsers/dreamMachinesParser';
import { syncMarsDealer } from './parsers/marsDealershipParser';
import { syncPhilpottFord } from './parsers/philpottFordParser';

async function main() {
  console.log('🚗 Starting Other Vendors Batch 2...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Timeout: 45 minutes`);
  console.log('Parsers:');
  console.log('  • Dream Machines of Texas');
  console.log('  • Mars Dealership');
  console.log('  • Philpott Ford');
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

  console.log('✅ Supabase credentials found\n');

  const results = {
    dreamMachines: { success: false, error: null as string | null },
    marsDealer: { success: false, error: null as string | null },
    philpottFord: { success: false, error: null as string | null }
  };

  const startTime = Date.now();

  // 1. Dream Machines of Texas
  try {
    console.log('🏍️  [1/3] Dream Machines of Texas...');
    await syncDreamMachines(supabaseUrl, supabaseKey);
    results.dreamMachines.success = true;
    console.log('✅ Dream Machines of Texas completed\n');
  } catch (error) {
    results.dreamMachines.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Dream Machines of Texas failed:', error, '\n');
  }

  // 2. Mars Dealership
  try {
    console.log('🚗 [2/3] Mars Dealership...');
    await syncMarsDealer(supabaseUrl, supabaseKey);
    results.marsDealer.success = true;
    console.log('✅ Mars Dealership completed\n');
  } catch (error) {
    results.marsDealer.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Mars Dealership failed:', error, '\n');
  }

  // 3. Philpott Ford
  try {
    console.log('🚗 [3/3] Philpott Ford...');
    await syncPhilpottFord(supabaseUrl, supabaseKey);
    results.philpottFord.success = true;
    console.log('✅ Philpott Ford completed\n');
  } catch (error) {
    results.philpottFord.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Philpott Ford failed:', error, '\n');
  }

  // Summary
  const duration = (Date.now() - startTime) / 1000 / 60;
  console.log('='.repeat(60));
  console.log('📊 SUMMARY - Other Vendors Batch 2');
  console.log('='.repeat(60));
  console.log(`Dream Machines:  ${results.dreamMachines.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Mars Dealership: ${results.marsDealer.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Philpott Ford:   ${results.philpottFord.success ? '✅ Success' : '❌ Failed'}`);
  console.log('='.repeat(60));

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n🎉 Completed: ${successCount}/3 parsers successful in ${duration.toFixed(2)} minutes`);
  console.log('='.repeat(60));

  // Exit with error if any parser failed
  if (successCount < 3) {
    console.error('\n⚠️  Some parsers failed - check logs above');
    process.exit(1);
  }

  console.log('\n✅ All parsers completed successfully!');
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
