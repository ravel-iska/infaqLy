/**
 * Optimize image URLs for better Lighthouse performance.
 * - Unsplash: adds &fm=webp&q=75 for WebP format + quality reduction
 * - Google Photos: adds =s{size} for server-side resize
 * - Other: returns as-is
 */
export function optimizeImageUrl(url, width = 400) {
  if (!url) return url;
  
  // Unsplash images: request WebP format with quality reduction
  if (url.includes('images.unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    // Remove existing fm= and q= params if any, then add optimized ones
    let cleanUrl = url.replace(/[&?]fm=[^&]*/g, '').replace(/[&?]q=[^&]*/g, '');
    return `${cleanUrl}${separator}fm=webp&q=75&w=${width}`;
  }
  
  // Google Photos/lh3: use resize parameter
  if (url.includes('lh3.googleusercontent.com')) {
    // Replace any existing =s or =w params, or append
    return url.replace(/=(?:s|w)\d+.*$/, `=s${width}`) || `${url}=s${width}`;
  }
  
  return url;
}
