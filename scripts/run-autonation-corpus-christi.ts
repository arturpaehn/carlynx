#!/usr/bin/env ts-node

/**
 * Run AutoNation USA Corpus Christi parser only
 * Scheduled to run at 03:45 UTC in GitHub Actions
 */

import { syncAutoNationUsaCorpusChristi } from './parsers/autoNationUsaCorpusChristiParser';

async function main() {
  console.log('🚗 Starting AutoNation USA Corpus Christi parser...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`⏱️  Timeout: 60 minutes per parser`);
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();
    await syncAutoNationUsaCorpusChristi();
    const duration = (Date.now() - startTime) / 1000 / 60;
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ AutoNation USA Corpus Christi completed in ${duration.toFixed(2)} minutes`);
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ AutoNation USA Corpus Christi failed:');
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

main();
