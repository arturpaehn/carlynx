import { NextResponse } from 'next/server';
import { syncMarsDealer } from '../../../../../scripts/parsers/marsDealershipParser';
import { syncAutoBoutique } from '../../../../../scripts/parsers/autoBoutiqueParser';
import { syncPreOwnedPlus } from '../../../../../scripts/parsers/preOwnedPlusParser';
import { syncLeifJohnson } from '../../../../../scripts/parsers/leifJohnsonParser';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  // Use custom header because Authorization header may be filtered by proxies
  const cronSecret = request.headers.get('x-cron-secret');
  const CRON_SECRET = process.env.CRON_SECRET || '1c1c602eb6ed92b2be414269b77a0a936096dad2500b81663283ab595fe0ae5e';
  
  if (cronSecret !== CRON_SECRET) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('🕐 Cron job triggered: External listings sync');
    
    // Pass credentials explicitly to avoid env variable issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log(`🔑 Env check: url=${!!supabaseUrl}, key=${!!supabaseKey}`);
    
    const results = {
      marsDealer: { success: false, error: null as string | null, count: 0 },
      autoBoutique: { success: false, error: null as string | null, count: 0 },
      preOwnedPlus: { success: false, error: null as string | null, count: 0 },
      leifJohnson: { success: false, error: null as string | null, count: 0 }
    };
    
    // Sync Mars Dealership
    try {
      console.log('\n🚗 Starting Mars Dealership sync...');
      await syncMarsDealer(supabaseUrl, supabaseKey);
      results.marsDealer.success = true;
      console.log('✅ Mars Dealership sync completed');
    } catch (error) {
      results.marsDealer.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Mars Dealership sync failed:', error);
    }
    
    // Sync Auto Boutique Texas
    try {
      console.log('\n🚗 Starting Auto Boutique Texas sync...');
      await syncAutoBoutique(supabaseUrl, supabaseKey);
      results.autoBoutique.success = true;
      console.log('✅ Auto Boutique Texas sync completed');
    } catch (error) {
      results.autoBoutique.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Auto Boutique Texas sync failed:', error);
    }
    
    // Sync Pre-owned Plus
    try {
      console.log('\n🚗 Starting Pre-owned Plus sync...');
      await syncPreOwnedPlus(supabaseUrl, supabaseKey);
      results.preOwnedPlus.success = true;
      console.log('✅ Pre-owned Plus sync completed');
    } catch (error) {
      results.preOwnedPlus.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Pre-owned Plus sync failed:', error);
    }
    
    // Sync Leif Johnson
    try {
      console.log('\n🚗 Starting Leif Johnson sync...');
      await syncLeifJohnson(supabaseUrl, supabaseKey);
      results.leifJohnson.success = true;
      console.log('✅ Leif Johnson sync completed');
    } catch (error) {
      results.leifJohnson.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Leif Johnson sync failed:', error);
    }
    
    const allSuccess = results.marsDealer.success && results.autoBoutique.success && results.preOwnedPlus.success && results.leifJohnson.success;
    
    return NextResponse.json({ 
      success: allSuccess, 
      message: allSuccess ? 'All syncs completed successfully' : 'Some syncs failed',
      results,
      timestamp: new Date().toISOString()
    }, { status: allSuccess ? 200 : 207 }); // 207 Multi-Status if partial success
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
