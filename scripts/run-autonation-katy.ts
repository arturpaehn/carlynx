#!/usr/bin/env ts-node

/**
 * Run AutoNation USA Katy parser only
 * Scheduled to run at 02:30 UTC in GitHub Actions
 */

import { syncAutoNationUsaKaty } from './parsers/autoNationUsaKatyParser';

async function main() {
  console.log('🚗 Starting AutoNation USA Katy parser...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Timeout: 60 minutes per parser`);
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();
    await syncAutoNationUsaKaty();
    const duration = (Date.now() - startTime) / 1000 / 60;
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ AutoNation USA Katy completed in ${duration.toFixed(2)} minutes`);
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ AutoNation USA Katy failed:');
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

main();
