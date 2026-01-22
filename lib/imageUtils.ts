/**
 * Image Utilities for Tavvy Mobile App
 * Provides image URL optimization for various sources
 */

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: ImageOptions = {
  width: 800,
  quality: 75,
  format: 'auto'
};

/**
 * Optimizes an image URL based on its source
 * Supports: Supabase Storage, Unsplash, Cloudinary, Imgix
 * 
 * @param url - The original image URL
 * @param options - Optimization options (width, height, quality, format)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageOptions = {}
): string {
  if (!url) return '';
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, quality, format } = opts;

  // Supabase Storage - use render endpoint with transformations
  if (url.includes('supabase.co/storage')) {
    // Convert /object/public/ to /render/image/public/ for transformations
    let transformedUrl = url.replace('/object/public/', '/render/image/public/');
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (quality) params.append('quality', quality.toString());
    
    const separator = transformedUrl.includes('?') ? '&' : '?';
    return `${transformedUrl}${separator}${params.toString()}`;
  }

  // Unsplash - use their URL parameters
  if (url.includes('unsplash.com')) {
    // Remove existing params and add optimized ones
    const baseUrl = url.split('?')[0];
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (quality) params.append('q', quality.toString());
    params.append('auto', 'format');
    params.append('fit', 'crop');
    
    return `${baseUrl}?${params.toString()}`;
  }

  // Cloudinary - use their transformation URL format
  if (url.includes('cloudinary.com')) {
    const transforms = [];
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (quality) transforms.push(`q_${quality}`);
    transforms.push('f_auto');
    
    const transformString = transforms.join(',');
    return url.replace('/upload/', `/upload/${transformString}/`);
  }

  // Imgix - use their URL parameters
  if (url.includes('imgix.net')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (quality) params.append('q', quality.toString());
    params.append('auto', 'format');
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  // For other URLs, return as-is (can't optimize externally)
  return url;
}

/**
 * Get thumbnail version of an image (smaller size for lists/grids)
 */
export function getThumbnailUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 400, quality: 70 });
}

/**
 * Get cover image version (medium size for article covers)
 */
export function getCoverImageUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 800, quality: 75 });
}

/**
 * Get full-size image version (for detail views)
 */
export function getFullImageUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 1200, quality: 80 });
}

/**
 * Get avatar image version (small square)
 */
export function getAvatarUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 200, height: 200, quality: 75 });
}

/**
 * Check if URL is from an optimizable source
 */
export function isOptimizableUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('supabase.co/storage') ||
    url.includes('unsplash.com') ||
    url.includes('cloudinary.com') ||
    url.includes('imgix.net')
  );
}
