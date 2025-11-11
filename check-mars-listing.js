require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMars() {
  const { data, error } = await supabase
    .from('external_listings')
    .select('id, title, source, image_url, image_url_2, image_url_3, image_url_4, created_at')
    .ilike('title', '%subaru%')
    .eq('source', 'mars_dealership')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('\n✅ Found Subaru from Mars Dealership:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log(`\n🔗 Open in browser: http://localhost:3002/listing/${data[0].id}`);
  } else {
    console.log('❌ No Subaru found from Mars Dealership');
  }
}

checkMars();
