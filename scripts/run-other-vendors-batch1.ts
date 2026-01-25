#!/usr/bin/env ts-node

/**
 * Run Other Vendors Batch 1
 * Scheduled to run at 05:00 UTC in GitHub Actions
 * Parsers: Auto Boutique, Auto Center of Texas
 */

import { syncAutoBoutique } from './parsers/autoBoutiqueParser';
import { syncAutoCenterTexas } from './parsers/autoCenterTexasParser';

async function main() {
  console.log('🚗 Starting Other Vendors Batch 1...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Timeout: 45 minutes`);
  console.log('Parsers:');
  console.log('  • Auto Boutique');
  console.log('  • Auto Center of Texas');
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
    autoBoutique: { success: false, error: null as string | null },
    autoCenterTexas: { success: false, error: null as string | null }
  };

  const startTime = Date.now();

  // 1. Auto Boutique Texas
  try {
    console.log('🚗 [1/2] Auto Boutique Texas...');
    await syncAutoBoutique(supabaseUrl, supabaseKey);
    results.autoBoutique.success = true;
    console.log('✅ Auto Boutique Texas completed\n');
  } catch (error) {
    results.autoBoutique.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto Boutique Texas failed:', error, '\n');
  }

  // 2. Auto Center of Texas
  try {
    console.log('🚗 [2/2] Auto Center of Texas...');
    await syncAutoCenterTexas(supabaseUrl, supabaseKey);
    results.autoCenterTexas.success = true;
    console.log('✅ Auto Center of Texas completed\n');
  } catch (error) {
    results.autoCenterTexas.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto Center of Texas failed:', error, '\n');
  }

  // Summary
  const duration = (Date.now() - startTime) / 1000 / 60;
  console.log('='.repeat(60));
  console.log('📊 SUMMARY - Other Vendors Batch 1');
  console.log('='.repeat(60));
  console.log(`Auto Boutique:         ${results.autoBoutique.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Auto Center of Texas:  ${results.autoCenterTexas.success ? '✅ Success' : '❌ Failed'}`);
  console.log('='.repeat(60));

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n🎉 Completed: ${successCount}/2 parsers successful in ${duration.toFixed(2)} minutes`);
  console.log('='.repeat(60));

  // Exit with error if any parser failed
  if (successCount < 2) {
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
