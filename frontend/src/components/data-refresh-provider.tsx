'use client';

import { useEffect } from 'react';
import { listenForRefreshEvents } from '@/lib/refresh-utils';

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up global event listeners for data refresh
    const cleanup = listenForRefreshEvents();
    
    return cleanup;
  }, []);

  return <>{children}</>;
}
