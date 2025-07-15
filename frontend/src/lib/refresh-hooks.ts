import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDataRefresh } from './data-refresh';
import { invalidateAfterPostMutation } from './cache-actions';

// Hook for automatic data refresh in components
export function useAutoRefresh() {
  const router = useRouter();
  const { subscribe, refreshFunctions } = useDataRefresh();

  // Force refresh the current page
  const forceRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Refresh data after post mutations
  const refreshAfterPostMutation = useCallback(async (slug?: string) => {
    await invalidateAfterPostMutation(slug);
    forceRefresh();
  }, [forceRefresh]);

  return {
    subscribe,
    forceRefresh,
    refreshAfterPostMutation,
    refreshFunctions,
  };
}

// Hook for components that display posts
export function usePostsRefresh(callback?: () => void) {
  const { subscribe } = useDataRefresh();

  useEffect(() => {
    if (!callback) return;

    const unsubscribers = [
      subscribe('posts', callback),
      subscribe('recent-posts', callback),
      subscribe('user-posts', callback),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe, callback]);
}

// Hook for components that display tags
export function useTagsRefresh(callback?: () => void) {
  const { subscribe } = useDataRefresh();

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = subscribe('tags', callback);
    return unsubscribe;
  }, [subscribe, callback]);
}

// Hook for components that display categories
export function useCategoriesRefresh(callback?: () => void) {
  const { subscribe } = useDataRefresh();

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = subscribe('categories', callback);
    return unsubscribe;
  }, [subscribe, callback]);
}

// Hook for components that display users (admin)
export function useUsersRefresh(callback?: () => void) {
  const { subscribe } = useDataRefresh();

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = subscribe('users', callback);
    return unsubscribe;
  }, [subscribe, callback]);
}

// Hook for components that display media
export function useMediaRefresh(callback?: () => void) {
  const { subscribe } = useDataRefresh();

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = subscribe('media', callback);
    return unsubscribe;
  }, [subscribe, callback]);
}

// Hook for specific post detail pages
export function usePostDetailRefresh(slug: string, callback?: () => void) {
  const { subscribe } = useDataRefresh();

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = subscribe(`post-detail-${slug}`, callback);
    return unsubscribe;
  }, [subscribe, callback, slug]);
}

// Hook for tag-specific post pages
export function useTagPostsRefresh(tagSlug: string, callback?: () => void) {
  const { subscribe } = useDataRefresh();

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = subscribe(`posts-by-tag-${tagSlug}`, callback);
    return unsubscribe;
  }, [subscribe, callback, tagSlug]);
}

// Hook for category-specific post pages
export function useCategoryPostsRefresh(categorySlug: string, callback?: () => void) {
  const { subscribe } = useDataRefresh();

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = subscribe(`posts-by-category-${categorySlug}`, callback);
    return unsubscribe;
  }, [subscribe, callback, categorySlug]);
}
