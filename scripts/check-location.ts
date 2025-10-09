import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkLocation() {
  console.log('📍 Checking location data...\n');
  
  const { data, error } = await supabase
    .from('external_listings')
    .select('id, title, state_id, city_id, city_name')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('Latest 5 listings with location data:\n');
  
  for (const listing of data || []) {
    // Get state name
    const { data: stateData } = await supabase
      .from('states')
      .select('name')
      .eq('id', listing.state_id)
      .single();
    
    // Get city name from cities table
    let cityFromTable = null;
    if (listing.city_id) {
      const { data: cityData } = await supabase
        .from('cities')
        .select('name')
        .eq('id', listing.city_id)
        .single();
      cityFromTable = cityData?.name;
    }
    
    console.log(`📍 ${listing.title}`);
    console.log(`   State ID: ${listing.state_id} (${stateData?.name || 'N/A'})`);
    console.log(`   City ID: ${listing.city_id || 'N/A'}`);
    console.log(`   City Name (from table): ${cityFromTable || 'N/A'}`);
    console.log(`   City Name (stored): ${listing.city_name || 'N/A'}`);
    console.log('');
  }
}

checkLocation().catch(console.error);
