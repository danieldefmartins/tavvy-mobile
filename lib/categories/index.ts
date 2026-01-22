/**
 * Tavvy Categories Module
 * 
 * Central export point for all category-related functionality.
 * 
 * Path: lib/categories/index.ts
 */

// Export category configuration
export * from '../categoryConfig';

// Export field configuration
export * from '../categoryFieldConfig';

// Export display configuration
export * from '../categoryDisplayConfig';

// Re-export commonly used types
export type {
  ContentType,
  MultiEntranceRequirement,
  ContentTypeConfig,
  SubCategory,
  PrimaryCategory,
} from '../categoryConfig';

export type {
  FieldType,
  FieldOption,
  CategoryField,
  CategoryFieldConfig,
} from '../categoryFieldConfig';