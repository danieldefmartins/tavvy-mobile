// Category Placeholder Images
// Uses Unsplash Source for free, high-quality placeholder images
// These URLs are stable and can be used directly in the app

export interface CategoryPlaceholder {
  keywords: string[];
  imageUrl: string;
  fallbackColor: string;
}

// Map of category keywords to placeholder images
// The keywords are matched against the place's category field (case-insensitive)
export const CATEGORY_PLACEHOLDERS: CategoryPlaceholder[] = [
  // Food & Restaurants
  {
    keywords: ['burger', 'hamburger', 'fast food', 'american grill'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    fallbackColor: '#8B4513',
  },
  {
    keywords: ['pizza', 'pizzeria'],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    fallbackColor: '#D2691E',
  },
  {
    keywords: ['italian', 'pasta', 'trattoria'],
    imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=600&fit=crop',
    fallbackColor: '#CD853F',
  },
  {
    keywords: ['sushi', 'japanese', 'ramen', 'asian fusion'],
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['mexican', 'taco', 'burrito', 'tex-mex', 'latin'],
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop',
    fallbackColor: '#FF6347',
  },
  {
    keywords: ['chinese', 'dim sum', 'noodle'],
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop',
    fallbackColor: '#8B0000',
  },
  {
    keywords: ['indian', 'curry', 'tandoori'],
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    fallbackColor: '#FF8C00',
  },
  {
    keywords: ['thai', 'vietnamese', 'pho'],
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
    fallbackColor: '#228B22',
  },
  {
    keywords: ['seafood', 'fish', 'oyster', 'lobster', 'crab'],
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
    fallbackColor: '#4682B4',
  },
  {
    keywords: ['steakhouse', 'steak', 'bbq', 'barbecue', 'grill'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
    fallbackColor: '#8B4513',
  },
  {
    keywords: ['restaurant', 'dining', 'eatery', 'bistro', 'brasserie'],
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  
  // Cafes & Coffee
  {
    keywords: ['coffee', 'cafe', 'espresso', 'coffeehouse', 'coffee shop'],
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
    fallbackColor: '#6F4E37',
  },
  {
    keywords: ['bakery', 'pastry', 'bread', 'patisserie'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
    fallbackColor: '#DEB887',
  },
  {
    keywords: ['dessert', 'ice cream', 'gelato', 'frozen yogurt', 'sweets'],
    imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&h=600&fit=crop',
    fallbackColor: '#FFB6C1',
  },
  
  // Bars & Nightlife
  {
    keywords: ['bar', 'pub', 'tavern', 'lounge', 'cocktail'],
    imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop',
    fallbackColor: '#2F2F2F',
  },
  {
    keywords: ['nightclub', 'club', 'disco', 'dance'],
    imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&h=600&fit=crop',
    fallbackColor: '#4B0082',
  },
  {
    keywords: ['brewery', 'beer', 'craft beer', 'taproom'],
    imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&h=600&fit=crop',
    fallbackColor: '#DAA520',
  },
  {
    keywords: ['wine', 'winery', 'wine bar', 'vineyard'],
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop',
    fallbackColor: '#722F37',
  },
  
  // Services
  {
    keywords: ['plumber', 'plumbing'],
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop',
    fallbackColor: '#4169E1',
  },
  {
    keywords: ['electrician', 'electrical'],
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop',
    fallbackColor: '#FFD700',
  },
  {
    keywords: ['auto', 'car', 'mechanic', 'automotive', 'repair shop', 'garage'],
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['salon', 'hair', 'barber', 'beauty', 'spa', 'nail'],
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
    fallbackColor: '#FFB6C1',
  },
  {
    keywords: ['dentist', 'dental', 'orthodontist'],
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
    fallbackColor: '#87CEEB',
  },
  {
    keywords: ['doctor', 'medical', 'clinic', 'hospital', 'healthcare', 'physician'],
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
    fallbackColor: '#4682B4',
  },
  {
    keywords: ['lawyer', 'attorney', 'legal', 'law firm'],
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['accountant', 'accounting', 'tax', 'cpa'],
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['real estate', 'realtor', 'property'],
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
    fallbackColor: '#228B22',
  },
  {
    keywords: ['cleaning', 'maid', 'housekeeping', 'janitorial'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop',
    fallbackColor: '#87CEEB',
  },
  {
    keywords: ['landscaping', 'lawn', 'garden', 'yard'],
    imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop',
    fallbackColor: '#228B22',
  },
  {
    keywords: ['hvac', 'heating', 'cooling', 'air conditioning'],
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
    fallbackColor: '#4682B4',
  },
  {
    keywords: ['roofing', 'roof', 'roofer'],
    imageUrl: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800&h=600&fit=crop',
    fallbackColor: '#8B4513',
  },
  {
    keywords: ['pest control', 'exterminator'],
    imageUrl: 'https://images.unsplash.com/photo-1632935190508-1e3b0f8c3e4f?w=800&h=600&fit=crop',
    fallbackColor: '#228B22',
  },
  
  // Fitness & Recreation
  {
    keywords: ['gym', 'fitness', 'workout', 'health club', 'crossfit'],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['yoga', 'pilates', 'meditation'],
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
    fallbackColor: '#9370DB',
  },
  {
    keywords: ['pool', 'swimming', 'aquatic'],
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop',
    fallbackColor: '#00CED1',
  },
  
  // Retail & Shopping
  {
    keywords: ['shopping', 'mall', 'retail', 'store', 'shop'],
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['grocery', 'supermarket', 'market', 'food store'],
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop',
    fallbackColor: '#228B22',
  },
  {
    keywords: ['pharmacy', 'drugstore', 'chemist'],
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop',
    fallbackColor: '#4169E1',
  },
  {
    keywords: ['clothing', 'apparel', 'fashion', 'boutique'],
    imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['electronics', 'tech', 'computer', 'phone'],
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['furniture', 'home decor', 'interior'],
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
    fallbackColor: '#8B4513',
  },
  {
    keywords: ['pet', 'pet store', 'veterinary', 'vet', 'animal'],
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',
    fallbackColor: '#DEB887',
  },
  {
    keywords: ['florist', 'flower', 'floral'],
    imageUrl: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&h=600&fit=crop',
    fallbackColor: '#FF69B4',
  },
  {
    keywords: ['jewelry', 'jeweler', 'watch'],
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop',
    fallbackColor: '#FFD700',
  },
  
  // Hospitality
  {
    keywords: ['hotel', 'motel', 'inn', 'resort', 'lodging', 'accommodation'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['airbnb', 'vacation rental', 'rental'],
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    fallbackColor: '#FF5A5F',
  },
  
  // Entertainment
  {
    keywords: ['movie', 'cinema', 'theater', 'theatre'],
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
    fallbackColor: '#8B0000',
  },
  {
    keywords: ['museum', 'gallery', 'art'],
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['park', 'playground', 'recreation'],
    imageUrl: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&h=600&fit=crop',
    fallbackColor: '#228B22',
  },
  {
    keywords: ['bowling', 'arcade', 'game'],
    imageUrl: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=800&h=600&fit=crop',
    fallbackColor: '#4B0082',
  },
  
  // Education
  {
    keywords: ['school', 'education', 'learning', 'academy', 'university', 'college'],
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['library'],
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop',
    fallbackColor: '#8B4513',
  },
  
  // Transportation
  {
    keywords: ['gas', 'gas station', 'fuel', 'petrol'],
    imageUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&h=600&fit=crop',
    fallbackColor: '#FF6347',
  },
  {
    keywords: ['car wash', 'auto wash'],
    imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop',
    fallbackColor: '#4682B4',
  },
  {
    keywords: ['parking', 'garage'],
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  
  // Financial
  {
    keywords: ['bank', 'banking', 'credit union', 'atm'],
    imageUrl: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&h=600&fit=crop',
    fallbackColor: '#2F4F4F',
  },
  {
    keywords: ['insurance'],
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
    fallbackColor: '#4169E1',
  },
];

// Default placeholder for unmatched categories
export const DEFAULT_PLACEHOLDER: CategoryPlaceholder = {
  keywords: [],
  imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
  fallbackColor: '#8E8E93',
};

/**
 * Get placeholder image URL for a given category
 * @param category - The place category string
 * @returns The placeholder image URL
 */
export function getPlaceholderImageForCategory(category: string): string {
  if (!category) return DEFAULT_PLACEHOLDER.imageUrl;
  
  const lowerCategory = category.toLowerCase();
  
  // Find matching placeholder
  for (const placeholder of CATEGORY_PLACEHOLDERS) {
    for (const keyword of placeholder.keywords) {
      if (lowerCategory.includes(keyword)) {
        return placeholder.imageUrl;
      }
    }
  }
  
  return DEFAULT_PLACEHOLDER.imageUrl;
}

/**
 * Get fallback color for a given category (used when image fails to load)
 * @param category - The place category string
 * @returns The fallback color hex code
 */
export function getFallbackColorForCategory(category: string): string {
  if (!category) return DEFAULT_PLACEHOLDER.fallbackColor;
  
  const lowerCategory = category.toLowerCase();
  
  // Find matching placeholder
  for (const placeholder of CATEGORY_PLACEHOLDERS) {
    for (const keyword of placeholder.keywords) {
      if (lowerCategory.includes(keyword)) {
        return placeholder.fallbackColor;
      }
    }
  }
  
  return DEFAULT_PLACEHOLDER.fallbackColor;
}
