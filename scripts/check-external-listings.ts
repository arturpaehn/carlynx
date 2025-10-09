import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkListings() {
  console.log('📊 Checking external listings in database...\n');
  
  const { data, error, count } = await supabase
    .from('external_listings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ Total listings: ${count}\n`);
  console.log('📋 Latest 10 listings:\n');
  
  data?.forEach((listing, i) => {
    console.log(`${i + 1}. ${listing.title}`);
    console.log(`   Year: ${listing.year} | Price: $${listing.price}`);
    console.log(`   Model: ${listing.model || 'N/A'}`);
    console.log(`   Transmission: ${listing.transmission || 'N/A'} | Mileage: ${listing.mileage || 'N/A'}`);
    console.log(`   Fuel: ${listing.fuel_type || 'N/A'}`);
    console.log(`   External ID: ${listing.external_id}`);
    console.log(`   URL: ${listing.external_url}`);
    console.log(`   Image: ${listing.image_url ? 'Yes' : 'No'}`);
    console.log(`   Active: ${listing.is_active}`);
    console.log('');
  });
}

checkListings().catch(console.error);
