#!/usr/bin/env ts-node

/**
 * Run AutoNation USA Houston parser only
 * Scheduled to run at 01:15 UTC in GitHub Actions
 */

import { syncAutoNationUsaHouston } from './parsers/autoNationUsaHoustonParser';

async function main() {
  console.log('🚗 Starting AutoNation USA Houston parser...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Timeout: 60 minutes per parser`);
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();
    await syncAutoNationUsaHouston();
    const duration = (Date.now() - startTime) / 1000 / 60;
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ AutoNation USA Houston completed in ${duration.toFixed(2)} minutes`);
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ AutoNation USA Houston failed:');
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

main();
