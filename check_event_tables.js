const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking for events and event_reviews tables...\n');
  
  // Try to query events table
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .limit(1);
  
  if (eventsError) {
    console.log('❌ events table:', eventsError.message);
  } else {
    console.log('✅ events table exists');
  }
  
  // Try to query event_reviews table
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('event_reviews')
    .select('*')
    .limit(1);
  
  if (reviewsError) {
    console.log('❌ event_reviews table:', reviewsError.message);
  } else {
    console.log('✅ event_reviews table exists');
  }
  
  // Try to query event_review_signal_taps table
  const { data: tapsData, error: tapsError } = await supabase
    .from('event_review_signal_taps')
    .select('*')
    .limit(1);
  
  if (tapsError) {
    console.log('❌ event_review_signal_taps table:', tapsError.message);
  } else {
    console.log('✅ event_review_signal_taps table exists');
  }
}

checkTables();
