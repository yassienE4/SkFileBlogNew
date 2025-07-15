import { revalidateTag } from 'next/cache';

// Cache tags for different data types
export const CACHE_TAGS = {
  POSTS: 'posts',
  POST_DETAIL: 'post-detail',
  TAGS: 'tags',
  CATEGORIES: 'categories',
  USERS: 'users',
  MEDIA: 'media',
  RECENT_POSTS: 'recent-posts',
  USER_POSTS: 'user-posts',
  POSTS_BY_TAG: 'posts-by-tag',
  POSTS_BY_CATEGORY: 'posts-by-category',
} as const;

// Client-side data refresh utility
export class DataRefreshManager {
  private static instance: DataRefreshManager;
  private subscribers: Map<string, Set<() => void>> = new Map();

  private constructor() {}

  static getInstance(): DataRefreshManager {
    if (!DataRefreshManager.instance) {
      DataRefreshManager.instance = new DataRefreshManager();
    }
    return DataRefreshManager.instance;
  }

  // Subscribe to data refresh events
  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    const callbacks = this.subscribers.get(key)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  // Notify all subscribers of a data change
  notify(key: string): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in data refresh callback for ${key}:`, error);
        }
      });
    }
  }

  // Refresh multiple data types
  notifyMultiple(keys: string[]): void {
    keys.forEach(key => this.notify(key));
  }

  // Clear all subscribers (useful for cleanup)
  clear(): void {
    this.subscribers.clear();
  }
}

// Server-side cache invalidation functions
export async function invalidateServerCache(tags: string[]) {
  if (typeof window === 'undefined') {
    // Server-side: use Next.js revalidateTag
    for (const tag of tags) {
      try {
        revalidateTag(tag);
      } catch (error) {
        console.error(`Failed to revalidate tag ${tag}:`, error);
      }
    }
  }
}

// Client-side data refresh functions
export function invalidateClientCache(keys: string[]) {
  if (typeof window !== 'undefined') {
    const manager = DataRefreshManager.getInstance();
    keys.forEach(key => manager.notify(key));
  }
}

// Combined refresh function for both server and client
export async function refreshData(tags: string[], keys: string[] = []) {
  // Server-side cache invalidation
  await invalidateServerCache(tags);
  
  // Client-side data refresh
  if (keys.length > 0) {
    invalidateClientCache(keys);
  }
  
  // Also refresh the page if we're in the browser
  if (typeof window !== 'undefined' && window.location) {
    // Force a router refresh to update server components
    const { useRouter } = await import('next/navigation');
    // Note: This will be handled by individual components
  }
}

// Specific refresh functions for different data types
export const refreshFunctions = {
  // Post-related refreshes
  refreshPosts: () => refreshData([
    CACHE_TAGS.POSTS,
    CACHE_TAGS.RECENT_POSTS,
    CACHE_TAGS.USER_POSTS,
  ], ['posts', 'recent-posts', 'user-posts']),

  refreshPostDetail: (slug: string) => refreshData([
    `${CACHE_TAGS.POST_DETAIL}-${slug}`,
  ], [`post-detail-${slug}`]),

  refreshTags: () => refreshData([
    CACHE_TAGS.TAGS,
  ], ['tags']),

  refreshCategories: () => refreshData([
    CACHE_TAGS.CATEGORIES,
  ], ['categories']),

  refreshUsers: () => refreshData([
    CACHE_TAGS.USERS,
  ], ['users']),

  refreshMedia: () => refreshData([
    CACHE_TAGS.MEDIA,
  ], ['media']),

  refreshPostsByTag: (tagSlug: string) => refreshData([
    `${CACHE_TAGS.POSTS_BY_TAG}-${tagSlug}`,
  ], [`posts-by-tag-${tagSlug}`]),

  refreshPostsByCategory: (categorySlug: string) => refreshData([
    `${CACHE_TAGS.POSTS_BY_CATEGORY}-${categorySlug}`,
  ], [`posts-by-category-${categorySlug}`]),

  // Combined refresh for major post operations
  refreshAfterPostMutation: (slug?: string) => {
    const tags: string[] = [
      CACHE_TAGS.POSTS,
      CACHE_TAGS.RECENT_POSTS,
      CACHE_TAGS.USER_POSTS,
      CACHE_TAGS.TAGS,
      CACHE_TAGS.CATEGORIES,
    ];
    
    const keys = [
      'posts',
      'recent-posts',
      'user-posts',
      'tags',
      'categories',
    ];

    if (slug) {
      tags.push(`${CACHE_TAGS.POST_DETAIL}-${slug}`);
      keys.push(`post-detail-${slug}`);
    }

    return refreshData(tags, keys);
  },
};

// Hook for using data refresh in React components
export function useDataRefresh() {
  const manager = DataRefreshManager.getInstance();
  
  return {
    subscribe: manager.subscribe.bind(manager),
    notify: manager.notify.bind(manager),
    notifyMultiple: manager.notifyMultiple.bind(manager),
    refreshFunctions,
  };
}
