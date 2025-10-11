const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
  console.log('🔍 Checking external listings...\n');
  
  // Count by source
  const { data: mars, error: marsError, count: marsCount } = await supabase
    .from('external_listings')
    .select('id', { count: 'exact' })
    .eq('source', 'mars_dealership')
    .eq('is_active', true);
    
  const { data: autoBoutique, error: autoError, count: autoCount } = await supabase
    .from('external_listings')
    .select('id', { count: 'exact' })
    .eq('source', 'auto_boutique_texas')
    .eq('is_active', true);
    
  const { data: total, error: totalError, count: totalCount } = await supabase
    .from('external_listings')
    .select('id', { count: 'exact' })
    .eq('is_active', true);
  
  console.log('📊 Active External Listings:');
  console.log('  Mars Dealership:', marsCount || 0, `(${mars?.length || 0} returned)`);
  console.log('  Auto Boutique Texas:', autoCount || 0, `(${autoBoutique?.length || 0} returned)`);
  console.log('  Total:', totalCount || 0, `(${total?.length || 0} returned)`);
  
  if (marsError) console.error('❌ Mars error:', marsError);
  if (autoError) console.error('❌ Auto Boutique error:', autoError);
  if (totalError) console.error('❌ Total error:', totalError);
  
  // Show first 5 Auto Boutique listings if any
  if (autoBoutique && autoBoutique.length > 0) {
    console.log('\n📋 Sample Auto Boutique listings:');
    const { data: samples } = await supabase
      .from('external_listings')
      .select('id, title, source, is_active')
      .eq('source', 'auto_boutique_texas')
      .limit(5);
    console.log(samples);
  }
}

checkCounts();
