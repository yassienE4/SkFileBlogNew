import { useEffect, useCallback, useRef } from 'react';
import { DataRefreshManager } from './data-refresh';

// Hook specifically for admin panel to avoid constant refresh issues
export function useAdminDataRefresh(
  activeTab: string,
  onRefresh: () => void,
  dependencies: any[] = []
) {
  const manager = DataRefreshManager.getInstance();
  const onRefreshRef = useRef(onRefresh);
  
  // Keep the refresh function reference stable
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const stableRefresh = () => {
      onRefreshRef.current();
    };

    let unsubscribePosts: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;

    // Subscribe to relevant events based on active tab
    if (activeTab === 'posts') {
      unsubscribePosts = manager.subscribe('posts', stableRefresh);
    } else if (activeTab === 'users') {
      unsubscribeUsers = manager.subscribe('users', stableRefresh);
    }

    return () => {
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [activeTab, manager, ...dependencies]);
}

// Hook for debounced data loading to prevent excessive API calls
export function useDebounceDataLoader(
  loadFunction: () => Promise<void>,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadFunctionRef = useRef(loadFunction);
  
  // Keep the load function reference stable
  loadFunctionRef.current = loadFunction;

  const debouncedLoad = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      loadFunctionRef.current();
    }, delay);
  }, [delay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedLoad;
}

// Hook for stable admin data loading
export function useAdminDataLoader(
  loadFunction: () => Promise<void>,
  dependencies: any[] = []
) {
  const loadFunctionRef = useRef(loadFunction);
  
  // Keep the load function reference stable
  loadFunctionRef.current = loadFunction;

  const stableLoad = useCallback(() => {
    return loadFunctionRef.current();
  }, []);

  // Initial load and dependency-based reloads
  useEffect(() => {
    stableLoad();
  }, dependencies);

  return stableLoad;
}
