const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const eventSignals = [
  // THE GOOD (best_for)
  { slug: 'event_amazing_lineup', label: 'Amazing Lineup', icon_emoji: '🎤', signal_type: 'best_for', color: '#0A84FF', is_active: true },
  { slug: 'event_great_sound', label: 'Great Sound', icon_emoji: '🎶', signal_type: 'best_for', color: '#0A84FF', is_active: true },
  { slug: 'event_high_energy', label: 'High Energy', icon_emoji: '⚡', signal_type: 'best_for', color: '#0A84FF', is_active: true },
  { slug: 'event_well_organized', label: 'Well Organized', icon_emoji: '🎨', signal_type: 'best_for', color: '#0A84FF', is_active: true },
  { slug: 'event_good_crowd', label: 'Good Crowd', icon_emoji: '👥', signal_type: 'best_for', color: '#0A84FF', is_active: true },
  { slug: 'event_easy_to_find', label: 'Easy to Find', icon_emoji: '📍', signal_type: 'best_for', color: '#0A84FF', is_active: true },
  { slug: 'event_worth_price', label: 'Worth the Price', icon_emoji: '🎟️', signal_type: 'best_for', color: '#0A84FF', is_active: true },
  { slug: 'event_good_food_drinks', label: 'Good Food/Drinks', icon_emoji: '🍕', signal_type: 'best_for', color: '#0A84FF', is_active: true },
  
  // THE VIBE (vibe)
  { slug: 'event_electric', label: 'Electric', icon_emoji: '🔥', signal_type: 'vibe', color: '#8B5CF6', is_active: true },
  { slug: 'event_chill', label: 'Chill', icon_emoji: '😌', signal_type: 'vibe', color: '#8B5CF6', is_active: true },
  { slug: 'event_family_friendly', label: 'Family Friendly', icon_emoji: '👨‍👩‍👧‍👦', signal_type: 'vibe', color: '#8B5CF6', is_active: true },
  { slug: 'event_intimate', label: 'Intimate', icon_emoji: '🌟', signal_type: 'vibe', color: '#8B5CF6', is_active: true },
  { slug: 'event_festival_vibes', label: 'Festival Vibes', icon_emoji: '🎊', signal_type: 'vibe', color: '#8B5CF6', is_active: true },
  { slug: 'event_artsy', label: 'Artsy', icon_emoji: '🎭', signal_type: 'vibe', color: '#8B5CF6', is_active: true },
  { slug: 'event_dance_party', label: 'Dance Party', icon_emoji: '💃', signal_type: 'vibe', color: '#8B5CF6', is_active: true },
  { slug: 'event_late_night', label: 'Late Night', icon_emoji: '🌃', signal_type: 'vibe', color: '#8B5CF6', is_active: true },
  
  // HEADS UP (heads_up)
  { slug: 'event_overpriced', label: 'Overpriced', icon_emoji: '💰', signal_type: 'heads_up', color: '#FF9500', is_active: true },
  { slug: 'event_too_crowded', label: 'Too Crowded', icon_emoji: '👥', signal_type: 'heads_up', color: '#FF9500', is_active: true },
  { slug: 'event_parking_nightmare', label: 'Parking Nightmare', icon_emoji: '🚗', signal_type: 'heads_up', color: '#FF9500', is_active: true },
  { slug: 'event_long_wait_times', label: 'Long Wait Times', icon_emoji: '⏱️', signal_type: 'heads_up', color: '#FF9500', is_active: true },
  { slug: 'event_too_loud', label: 'Too Loud', icon_emoji: '🔊', signal_type: 'heads_up', color: '#FF9500', is_active: true },
  { slug: 'event_poor_visibility', label: 'Poor Visibility', icon_emoji: '🚫', signal_type: 'heads_up', color: '#FF9500', is_active: true },
  { slug: 'event_weather_issues', label: 'Weather Issues', icon_emoji: '🌧️', signal_type: 'heads_up', color: '#FF9500', is_active: true },
  { slug: 'event_oversold', label: 'Oversold', icon_emoji: '🎫', signal_type: 'heads_up', color: '#FF9500', is_active: true }
];

async function insertEventSignals() {
  console.log('🎉 Inserting event signals into review_items table...');
  
  const { data, error } = await supabase
    .from('review_items')
    .insert(eventSignals)
    .select();
  
  if (error) {
    console.error('❌ Error inserting signals:', error);
    process.exit(1);
  }
  
  console.log('✅ Successfully inserted', data.length, 'event signals!');
  process.exit(0);
}

insertEventSignals();
