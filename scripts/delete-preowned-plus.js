// Delete all Pre-owned Plus listings from database
const { createClient } = require('@supabase/supabase-js');

async function deletePreOwnedPlusListings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🗑️  Deleting all Pre-owned Plus listings...');
  console.log(`🔑 Using database: ${supabaseUrl}`);
  
  // First count
  const { count: beforeCount } = await supabase
    .from('external_listings')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'preowned_plus');
  
  console.log(`📊 Found ${beforeCount || 0} listings to delete`);
  
  // Then delete
  const { error } = await supabase
    .from('external_listings')
    .delete()
    .eq('source', 'preowned_plus');
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } else {
    console.log(`✅ Deleted ${beforeCount || 0} Pre-owned Plus listings!`);
  }
}

deletePreOwnedPlusListings();

