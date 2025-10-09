import { NextResponse } from 'next/server';
import { syncMarsDealer } from '../../../../../scripts/parsers/marsDealershipParser';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  console.log('🔐 Auth check:', {
    receivedHeader: authHeader,
    expectedAuth: expectedAuth,
    secretExists: !!process.env.CRON_SECRET,
    secretLength: process.env.CRON_SECRET?.length || 0
  });
  
  if (authHeader !== expectedAuth) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json({ 
      error: 'Unauthorized',
      debug: {
        receivedHeader: authHeader,
        secretExists: !!process.env.CRON_SECRET
      }
    }, { status: 401 });
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
