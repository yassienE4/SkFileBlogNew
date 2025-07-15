/**
 * Media URL utilities for consistent media file handling
 */

import { getMediaBaseUrl } from './api';

/**
 * Generate a stable media URL using the frontend proxy
 * This ensures URLs remain valid even when the backend ngrok URL changes
 */
export function getMediaUrl(filePath: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  return `${getMediaBaseUrl()}/api/media/${cleanPath}`;
}

/**
 * Generate a media URL for use in markdown content
 * This is the same as getMediaUrl but with a more semantic name
 */
export function getMarkdownMediaUrl(filePath: string): string {
  return getMediaUrl(filePath);
}

/**
 * Extract file path from a media URL (useful for editing)
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Check if it's a media proxy URL
    if (path.startsWith('/api/media/')) {
      return path.replace('/api/media/', '');
    }
    
    // Handle legacy direct backend URLs
    if (path.startsWith('/media/')) {
      return path.replace('/media/', '');
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
}

/**
 * Check if a URL is a media URL (either proxy or direct)
 */
export function isMediaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.startsWith('/api/media/') || urlObj.pathname.startsWith('/media/');
  } catch (error) {
    return false;
  }
}
