import { NextResponse } from 'next/server';

// NOTE: Parsers are now run via GitHub Actions workflow, not via API routes
// This endpoint is kept for manual triggering via webhooks if needed
export const maxDuration = 60; // 1 minute max execution time

export async function GET(request: Request) {
  // Log all relevant headers for debugging
  console.log('🔍 Checking authorization...');
  console.log(`   x-vercel-cron: "${request.headers.get('x-vercel-cron')}"`);
  console.log(`   x-cron-secret: ${request.headers.get('x-cron-secret') ? 'provided' : 'missing'}`);
  console.log(`   host: ${request.headers.get('host')}`);
  
  // Verify the request is from Vercel Cron OR manual trigger with secret
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const manualSecret = request.headers.get('x-cron-secret');
  const CRON_SECRET = process.env.CRON_SECRET || '1c1c602eb6ed92b2be414269b77a0a936096dad2500b81663283ab595fe0ae5e';
  const host = request.headers.get('host') || '';
  const isVercelDomain = host.includes('vercel.app') || host.includes('carlynx.us');
  
  // Allow if:
  // 1. Vercel Cron automatic trigger (x-vercel-cron: 1)
  // 2. Manual trigger with correct secret
  // 3. Request from Vercel domain (trusted environment)
  const isAuthorized = isVercelCron || manualSecret === CRON_SECRET || isVercelDomain;
  
  if (!isAuthorized) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const authMethod = isVercelCron ? 'Vercel Cron' : (manualSecret === CRON_SECRET ? 'Manual trigger' : 'Vercel domain');
  console.log(`✅ Authorized: ${authMethod}`);

  
  try {
    console.log('🕐 Cron job endpoint called: External listings sync');
    console.log('ℹ️  Parsers now run via GitHub Actions workflow');
    console.log('ℹ️  See: .github/workflows/sync-parsers.yml');
    
    // This endpoint can be used to trigger GitHub Actions via workflow_dispatch
    // or just return status information
    
    return NextResponse.json({ 
      success: true, 
      message: 'Parsers run via GitHub Actions (see .github/workflows/sync-parsers.yml)',
      info: 'This endpoint is deprecated. Use GitHub Actions for scheduled parser runs.',
      githubActions: {
        workflow: 'sync-parsers.yml',
        schedule: 'Daily at 14:00 UTC',
        manualTrigger: 'Available via GitHub Actions tab'
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
