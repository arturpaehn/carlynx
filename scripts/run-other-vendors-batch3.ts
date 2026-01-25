#!/usr/bin/env ts-node

/**
 * Run Other Vendors Batch 3
 * Scheduled to run at 08:00 UTC in GitHub Actions
 * Parsers: Pre-owned Plus, Right Drive
 */

import { syncPreOwnedPlus } from './parsers/preOwnedPlusParser';
import { syncRightDrive } from './parsers/rightDriveParser';

async function main() {
  console.log('🚗 Starting Other Vendors Batch 3...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Timeout: 45 minutes`);
  console.log('Parsers:');
  console.log('  • Pre-owned Plus');
  console.log('  • Right Drive Auto');
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
    preOwnedPlus: { success: false, error: null as string | null },
    rightDrive: { success: false, error: null as string | null }
  };

  const startTime = Date.now();

  // 1. Pre-owned Plus
  try {
    console.log('🚗 [1/2] Pre-owned Plus...');
    await syncPreOwnedPlus(supabaseUrl, supabaseKey);
    results.preOwnedPlus.success = true;
    console.log('✅ Pre-owned Plus completed\n');
  } catch (error) {
    results.preOwnedPlus.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Pre-owned Plus failed:', error, '\n');
  }

  // 2. Right Drive Auto
  try {
    console.log('🚗 [2/2] Right Drive Auto...');
    await syncRightDrive();
    results.rightDrive.success = true;
    console.log('✅ Right Drive Auto completed\n');
  } catch (error) {
    results.rightDrive.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Right Drive Auto failed:', error, '\n');
  }

  // Summary
  const duration = (Date.now() - startTime) / 1000 / 60;
  console.log('='.repeat(60));
  console.log('📊 SUMMARY - Other Vendors Batch 3');
  console.log('='.repeat(60));
  console.log(`Pre-owned Plus:   ${results.preOwnedPlus.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Right Drive Auto: ${results.rightDrive.success ? '✅ Success' : '❌ Failed'}`);
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
