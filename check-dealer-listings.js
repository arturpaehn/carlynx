const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDealerListings() {
  console.log('Checking dealer vs individual listings and profiles...');
  
  // Проверим последние объявления
  const { data: listings } = await supabase
    .from('listings')
    .select('id, user_id, title, contact_by_phone, contact_by_email')
    .neq('user_id', 'external')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('Recent listings:');
  for (const listing of listings || []) {
    console.log(`\nListing: ${listing.title}`);
    console.log(`User ID: ${listing.user_id}`);
    console.log(`Contact by phone: ${listing.contact_by_phone}`);
    console.log(`Contact by email: ${listing.contact_by_email}`);
    
    // Найдем профиль этого пользователя
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, email, phone, user_type')
      .eq('user_id', listing.user_id)
      .single();
    
    if (profile) {
      console.log(`Profile: ${profile.name} (${profile.user_type})`);
      console.log(`Email: ${profile.email || 'N/A'}`);
      console.log(`Phone: ${profile.phone || 'N/A'}`);
    } else {
      console.log('Profile: NOT FOUND');
    }
  }
}

checkDealerListings().catch(console.error);