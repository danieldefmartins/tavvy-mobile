import { supabase } from './supabaseClient';

export async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Check if client is initialized
    console.log('✅ Supabase client initialized');
    
    // Test 2: Try to query the places table
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying places:', error);
      return { success: false, error };
    }
    
    console.log('✅ Successfully queried places!');
    console.log('📊 Found', data?.length, 'places');
    console.log('📄 First place:', data?.[0]);
    
    return { success: true, data };
    
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return { success: false, error: err };
  }
}
