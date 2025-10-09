import { NextResponse } from 'next/server';
import { syncMarsDealer } from '../../../../../scripts/parsers/marsDealershipParser';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const CRON_SECRET = process.env.CRON_SECRET || '1c1c602eb6ed92b2be414269b77a0a936096dad2500b81663283ab595fe0ae5e';
  const expectedAuth = `Bearer ${CRON_SECRET}`;
  
  if (authHeader !== expectedAuth) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('🕐 Cron job triggered: Mars Dealership sync');
    
    await syncMarsDealer();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mars Dealership sync completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
