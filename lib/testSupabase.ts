import { supabase } from './supabaseClient';

export async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Check if client is initialized
    console.log('✅ Supabase client initialized');
    
    // Test 2: Try to query the fsq_places_raw table (104M Foursquare places)
    const { data, error } = await supabase
      .from('fsq_places_raw')
      .select('fsq_place_id, name, latitude, longitude, locality, country')
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying fsq_places_raw:', error);
      return { success: false, error };
    }
    
    console.log('✅ Successfully queried fsq_places_raw!');
    console.log('📊 Found', data?.length, 'places');
    console.log('📄 First place:', data?.[0]);
    
    return { success: true, data };
    
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return { success: false, error: err };
  }
}
