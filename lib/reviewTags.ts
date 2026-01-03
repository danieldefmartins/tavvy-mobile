// Tavvy Review Tag Definitions
// These match the review_items table in Supabase

export interface ReviewTag {
  id: string;
  slug: string;
  label: string;
  icon: string;
}

// UUIDs from the database review_items table
export const REVIEW_TAGS = {
  best_for: [
    { id: '858746c4-a6e6-4496-975c-51b98c66a42c', slug: 'great_food', label: 'Great Food', icon: '🍽️' },
    { id: '72dd0220-9464-4204-b281-162417719aae', slug: 'fast_service', label: 'Fast Service', icon: '⏱️' },
    { id: '3defe0f6-7bf4-49dc-973b-26c8b88a0177', slug: 'good_value', label: 'Good Value', icon: '💰' },
    { id: '9442b41b-1ace-4c68-ab71-2a241328ef84', slug: 'family_friendly', label: 'Family-Friendly', icon: '👨‍👩‍👧' },
    { id: '79c0b658-a894-48d4-af5a-8cfa125bf005', slug: 'romantic', label: 'Romantic', icon: '💑' },
    { id: '36735d07-b096-4bc1-985f-ea4b58a47b54', slug: 'group_dining', label: 'Group Dining', icon: '👥' },
    { id: '4a83f028-a8f7-4e7d-9e4e-80250edf6ba5', slug: 'quick_bite', label: 'Quick Bite', icon: '🥪' },
    { id: '731d5238-a1f9-4826-9145-f8da079c7f87', slug: 'healthy_options', label: 'Healthy Options', icon: '🥗' },
  ],
  vibe: [
    { id: 'c569cc17-4092-4c0f-ae25-e3002f6ea701', slug: 'cozy', label: 'Cozy', icon: '🛋️' },
    { id: '157bf268-55ca-4eaf-aede-bf7a5607f046', slug: 'lively', label: 'Lively', icon: '🎉' },
    { id: '10ffecbe-0e4b-44da-a7ab-bc10a9ee57dd', slug: 'quiet', label: 'Quiet', icon: '🤫' },
    { id: '15b0e553-6356-474b-ac4d-148ca8e3a2ed', slug: 'trendy', label: 'Trendy', icon: '✨' },
    { id: '15b9d7be-f338-4c19-9f24-384656d0c7bf', slug: 'casual', label: 'Casual', icon: '👕' },
    { id: '29b3d2ba-e087-48f0-b587-8c89d8855f09', slug: 'upscale', label: 'Upscale', icon: '🎩' },
    { id: '8220d8fe-74f6-4c68-9c8d-d2ed5a2415d5', slug: 'local_favorite', label: 'Local Favorite', icon: '⭐' },
    { id: '9571b4f6-a95a-44a5-a383-686e27be3140', slug: 'tourist_spot', label: 'Tourist Spot', icon: '📸' },
  ],
  heads_up: [
    { id: 'e3510590-5a97-4418-a133-8e5cfa6ba183', slug: 'loud_music', label: 'Loud Music', icon: '🔊' },
    { id: 'd470ee16-f517-4627-800e-f7b924487361', slug: 'limited_parking', label: 'Limited Parking', icon: '🚗' },
    { id: '078b6645-f0c2-43a9-8a4b-5f96378f197a', slug: 'slow_service', label: 'Slow Service', icon: '🐌' },
    { id: 'eec8f786-e812-4108-8aae-07a46cdd2c62', slug: 'small_portions', label: 'Small Portions', icon: '🍽️' },
    { id: '5e14c8ac-420d-4877-960f-f5894c9d06e0', slug: 'pricey', label: 'Pricey', icon: '💸' },
    { id: '189c2240-8a27-4819-ab37-03ec3434e0ec', slug: 'cash_only', label: 'Cash Only', icon: '💵' },
    { id: '35f2dba1-048f-4297-b401-acbcbe40221e', slug: 'long_wait', label: 'Long Wait', icon: '⏰' },
    { id: '7a43fc81-77cc-4144-a83f-6d3147602070', slug: 'crowded', label: 'Crowded', icon: '👥' },
  ],
} as const;

export type ReviewCategory = keyof typeof REVIEW_TAGS;

export const CATEGORY_COLORS = {
  best_for: {
    bg: '#3B9FD9',
    text: '#FFFFFF',
  },
  vibe: {
    bg: '#6B7280',
    text: '#FFFFFF',
  },
  heads_up: {
    bg: '#E87D3E',
    text: '#FFFFFF',
  },
} as const;

export const CATEGORY_LABELS = {
  best_for: 'Best For',
  vibe: 'Vibe',
  heads_up: 'Heads Up',
} as const;

export const CATEGORY_ICONS = {
  best_for: '👍',
  vibe: '⭐',
  heads_up: '⚠️',
} as const;

// Helper function to get tag by ID
export function getTagById(tagId: string): ReviewTag | undefined {
  for (const category of Object.values(REVIEW_TAGS)) {
    const tag = category.find(t => t.id === tagId);
    if (tag) return tag;
  }
  return undefined;
}

// Helper function to get tag label from ID
export function getTagLabel(tagId: string): string {
  const tag = getTagById(tagId);
  if (tag) return tag.label;
  return tagId.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Helper function to get category from tag ID
export function getCategoryFromTag(tagId: string): ReviewCategory | null {
  for (const [category, tags] of Object.entries(REVIEW_TAGS)) {
    if (tags.some(t => t.id === tagId)) {
      return category as ReviewCategory;
    }
  }
  return null;
}

// Get all tags as a flat array
export function getAllTags(): (ReviewTag & { category: ReviewCategory })[] {
  const allTags: (ReviewTag & { category: ReviewCategory })[] = [];
  for (const [category, tags] of Object.entries(REVIEW_TAGS)) {
    for (const tag of tags) {
      allTags.push({ ...tag, category: category as ReviewCategory });
    }
  }
  return allTags;
}
