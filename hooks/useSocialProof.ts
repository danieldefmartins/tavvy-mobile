import { useState, useEffect } from 'react';

interface SocialProofStats {
  activeViewers: number;
  weeklyVisits: number;
  isTrending: boolean;
}

export function useSocialProof(placeId: string, category: string) {
  const [stats, setStats] = useState<SocialProofStats>({
    activeViewers: 0,
    weeklyVisits: 0,
    isTrending: false,
  });

  useEffect(() => {
    // 1. Determine "Base Heat" based on time of day and category
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    let baseMultiplier = 1.0;

    // Nightlife logic
    if (['bar', 'nightclub'].includes(category.toLowerCase())) {
      if (hour >= 20 || hour <= 2) baseMultiplier = 2.5; // Hot at night
    }
    // Coffee logic
    else if (['cafe', 'coffee'].includes(category.toLowerCase())) {
      if (hour >= 7 && hour <= 11) baseMultiplier = 2.0; // Hot in morning
    }
    // Lunch/Dinner logic
    else if (['restaurant'].includes(category.toLowerCase())) {
      if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) baseMultiplier = 1.8;
    }

    // Weekend boost
    if (isWeekend) baseMultiplier *= 1.3;

    // 2. Generate "Simulated Floor" (The Fake Data)
    // Random noise so it doesn't look static (e.g., 3 to 8 viewers)
    const noise = Math.floor(Math.random() * 5);
    const simulatedViewers = Math.floor((3 + noise) * baseMultiplier);
    
    // Weekly visits is roughly 50x daily viewers
    const simulatedWeekly = Math.floor(simulatedViewers * 50 * (0.8 + Math.random() * 0.4));

    // 3. In the future, fetch REAL data here:
    // const { data } = await supabase.rpc('get_real_viewers', { place_id: placeId });
    // const realViewers = data || 0;
    const realViewers = 0; // Placeholder for now

    // 4. The Hybrid Logic: MAX(Real, Simulated)
    const finalViewers = Math.max(realViewers, simulatedViewers);
    const finalWeekly = Math.max(0, simulatedWeekly); // Ensure positive

    setStats({
      activeViewers: finalViewers,
      weeklyVisits: finalWeekly,
      isTrending: finalViewers > 15, // Threshold for "Trending" badge
    });

  }, [placeId, category]);

  return stats;
}