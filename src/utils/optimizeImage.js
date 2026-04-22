/**
 * Optimize image URLs for better Lighthouse performance.
 * - Unsplash: adds &fm=webp&q=75 for WebP format + quality reduction
 * - Google Photos: adds =s{size} for server-side resize
 * - Other: returns as-is
 */
export function optimizeImageUrl(url, width = 400) {
  if (!url || typeof url !== 'string') return url;
  
  // Unsplash images: request WebP format with quality reduction
  if (url.includes('images.unsplash.com')) {
    // Safely escape special regex characters in the URL before manipulating
    let cleanUrl = url.replace(/[&?]fm=[^&]*/g, '').replace(/[&?]q=[^&]*/g, '').replace(/[&?]w=[^&]*/g, '');
    // Fix: remove dangling ? or & at the end after param removal
    cleanUrl = cleanUrl.replace(/[?&]$/, '');
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}fm=webp&q=75&w=${width}`;
  }
  
  // Google Photos/lh3: use resize parameter
  if (url.includes('lh3.googleusercontent.com')) {
    // Fix: use non-greedy regex to avoid consuming the entire URL after =s
    // Only match =s or =w followed by digits, optionally followed by more params
    if (/=(?:s|w)\d+/.test(url)) {
      return url.replace(/=(?:s|w)\d+[^/]*$/, `=s${width}`);
    }
    // No existing resize param — append one
    return `${url}=s${width}`;
  }
  
  return url;
}
