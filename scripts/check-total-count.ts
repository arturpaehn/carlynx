import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkTotalCount() {
  console.log('📊 Checking total active listings count...\n');
  
  // Regular listings
  const { count: regularCount, error: regularError } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (regularError) {
    console.error('❌ Error fetching regular listings:', regularError);
    return;
  }
  
  // External listings
  const { count: externalCount, error: externalError } = await supabase
    .from('external_listings')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (externalError) {
    console.error('❌ Error fetching external listings:', externalError);
    return;
  }
  
  const total = (regularCount ?? 0) + (externalCount ?? 0);
  
  console.log('✅ Regular Listings (active):', regularCount);
  console.log('✅ External Listings (active):', externalCount);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 TOTAL Active Listings:', total);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('This count will be displayed in the footer! 🎉');
}

checkTotalCount().catch(console.error);
