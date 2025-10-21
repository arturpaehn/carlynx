const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('Checking user_profiles table structure and data...');
  
  // Получаем все поля из user_profiles
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(3);
  
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  console.log('Sample user_profiles records:');
  console.log(JSON.stringify(profiles, null, 2));
  
  // Проверим последние объявления
  const { data: listings } = await supabase
    .from('listings')
    .select('id, user_id, title')
    .neq('user_id', 'external')
    .order('created_at', { ascending: false })
    .limit(2);
  
  console.log('\nRecent listings:');
  console.log(JSON.stringify(listings, null, 2));
  
  if (listings && listings.length > 0) {
    const userId = listings[0].user_id;
    console.log(`\nLooking for user_id: ${userId}`);
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('Profile found:');
    console.log(JSON.stringify(profile, null, 2));
    
    if (profileError) {
      console.log('Profile error:', profileError);
    }
  }
}

checkData().catch(console.error);