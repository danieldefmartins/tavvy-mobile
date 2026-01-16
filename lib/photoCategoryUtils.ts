// Photo Category Utilities
// Universal photo category system that adapts to business types

import { BusinessType } from './businessTypeConfig';

export interface PhotoCategory {
  id: string;
  name: string;
  icon: string;
}

// Base categories that work for ALL business types
const BASE_CATEGORIES: PhotoCategory[] = [
  { id: 'exterior', name: 'Exterior', icon: 'business' },
  { id: 'interior', name: 'Interior', icon: 'home' },
  { id: 'amenities', name: 'Amenities', icon: 'star' },
  { id: 'offerings', name: 'Offerings', icon: 'gift' },
  { id: 'surroundings', name: 'Surroundings', icon: 'earth' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

// Business-specific category extensions
const BUSINESS_EXTENSIONS: Partial<Record<BusinessType, PhotoCategory[]>> & { default: PhotoCategory[] } = {
  restaurant: [
    { id: 'food', name: 'Food', icon: 'restaurant' },
    { id: 'drinks', name: 'Drinks', icon: 'wine' },
    { id: 'menu', name: 'Menu', icon: 'document-text' },
  ],
  cafe: [
    { id: 'food', name: 'Food', icon: 'cafe' },
    { id: 'drinks', name: 'Drinks', icon: 'cafe' },
    { id: 'menu', name: 'Menu', icon: 'document-text' },
  ],
  bar: [
    { id: 'drinks', name: 'Drinks', icon: 'beer' },
    { id: 'food', name: 'Food', icon: 'fast-food' },
    { id: 'menu', name: 'Menu', icon: 'document-text' },
  ],
  rv_park: [
    { id: 'sites', name: 'Sites', icon: 'car' },
    { id: 'hookups', name: 'Hookups', icon: 'power' },
    { id: 'dump_station', name: 'Dump Station', icon: 'water' },
  ],
  campground: [
    { id: 'sites', name: 'Sites', icon: 'bonfire' },
    { id: 'hookups', name: 'Hookups', icon: 'power' },
    { id: 'dump_station', name: 'Dump Station', icon: 'water' },
  ],
  hotel: [
    { id: 'rooms', name: 'Rooms', icon: 'bed' },
    { id: 'pool', name: 'Pool', icon: 'water' },
    { id: 'lobby', name: 'Lobby', icon: 'business' },
  ],
  motel: [
    { id: 'rooms', name: 'Rooms', icon: 'bed' },
    { id: 'pool', name: 'Pool', icon: 'water' },
  ],
  retail: [
    { id: 'products', name: 'Products', icon: 'pricetag' },
    { id: 'displays', name: 'Displays', icon: 'grid' },
  ],
  gas_station: [
    { id: 'pumps', name: 'Pumps', icon: 'speedometer' },
    { id: 'store', name: 'Store', icon: 'storefront' },
  ],
  truck_stop: [
    { id: 'pumps', name: 'Pumps', icon: 'speedometer' },
    { id: 'store', name: 'Store', icon: 'storefront' },
  ],
  attraction: [
    { id: 'activities', name: 'Activities', icon: 'bicycle' },
    { id: 'events', name: 'Events', icon: 'calendar' },
  ],
  default: [],
};

// Get photo categories for a specific business type
export function getPhotoCategories(businessType: BusinessType): PhotoCategory[] {
  const extensions = BUSINESS_EXTENSIONS[businessType] || BUSINESS_EXTENSIONS.default;
  return [...BASE_CATEGORIES, ...extensions];
}

// Get category name by ID
export function getCategoryName(categoryId: string, businessType: BusinessType): string {
  const categories = getPhotoCategories(businessType);
  const category = categories.find(c => c.id === categoryId);
  return category?.name || categoryId;
}

// Get category icon by ID
export function getCategoryIcon(categoryId: string, businessType: BusinessType): string {
  const categories = getPhotoCategories(businessType);
  const category = categories.find(c => c.id === categoryId);
  return category?.icon || 'image';
}

// Validate if a category ID is valid for a business type
export function isValidCategory(categoryId: string, businessType: BusinessType): boolean {
  const categories = getPhotoCategories(businessType);
  return categories.some(c => c.id === categoryId);
}

// Get all possible category IDs (for type checking)
export function getAllCategoryIds(): string[] {
  const allCategories = new Set<string>();
  
  // Add base categories
  BASE_CATEGORIES.forEach(cat => allCategories.add(cat.id));
  
  // Add all business-specific categories
  Object.values(BUSINESS_EXTENSIONS).forEach(extensions => {
    extensions.forEach(cat => allCategories.add(cat.id));
  });
  
  return Array.from(allCategories);
}