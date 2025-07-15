import { refreshFunctions } from './data-refresh';

// Utility functions for triggering data refresh after mutations
export const refreshUtils = {
  // Refresh after creating a post
  afterCreatePost: async (slug: string) => {
    await refreshFunctions.refreshAfterPostMutation(slug);
  },

  // Refresh after updating a post
  afterUpdatePost: async (slug: string) => {
    await refreshFunctions.refreshAfterPostMutation(slug);
  },

  // Refresh after deleting a post
  afterDeletePost: async (slug: string) => {
    await refreshFunctions.refreshAfterPostMutation(slug);
  },

  // Refresh after creating a user
  afterCreateUser: async () => {
    await refreshFunctions.refreshUsers();
  },

  // Refresh after updating a user
  afterUpdateUser: async () => {
    await refreshFunctions.refreshUsers();
  },

  // Refresh after deleting a user
  afterDeleteUser: async () => {
    await refreshFunctions.refreshUsers();
  },

  // Refresh after uploading media
  afterUploadMedia: async () => {
    await refreshFunctions.refreshMedia();
  },

  // Refresh after deleting media
  afterDeleteMedia: async () => {
    await refreshFunctions.refreshMedia();
  },

  // Refresh all post-related data
  refreshAllPosts: async () => {
    await refreshFunctions.refreshPosts();
    await refreshFunctions.refreshTags();
    await refreshFunctions.refreshCategories();
  },

  // Refresh specific post detail
  refreshPostDetail: async (slug: string) => {
    await refreshFunctions.refreshPostDetail(slug);
  },

  // Refresh posts by tag
  refreshPostsByTag: async (tagSlug: string) => {
    await refreshFunctions.refreshPostsByTag(tagSlug);
  },

  // Refresh posts by category
  refreshPostsByCategory: async (categorySlug: string) => {
    await refreshFunctions.refreshPostsByCategory(categorySlug);
  },
};

// Event names for the refresh system
export const REFRESH_EVENTS = {
  POST_CREATED: 'post:created',
  POST_UPDATED: 'post:updated',
  POST_DELETED: 'post:deleted',
  USER_CREATED: 'user:created',
  USER_UPDATED: 'user:updated',
  USER_DELETED: 'user:deleted',
  MEDIA_UPLOADED: 'media:uploaded',
  MEDIA_DELETED: 'media:deleted',
} as const;

// Dispatch refresh events
export function dispatchRefreshEvent(eventName: string, data?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
}

// Listen for refresh events
export function listenForRefreshEvents() {
  if (typeof window === 'undefined') return;

  const handlePostCreated = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { slug } = customEvent.detail || {};
    refreshUtils.afterCreatePost(slug);
  };

  const handlePostUpdated = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { slug } = customEvent.detail || {};
    refreshUtils.afterUpdatePost(slug);
  };

  const handlePostDeleted = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { slug } = customEvent.detail || {};
    refreshUtils.afterDeletePost(slug);
  };

  const handleUserCreated = () => {
    refreshUtils.afterCreateUser();
  };

  const handleUserUpdated = () => {
    refreshUtils.afterUpdateUser();
  };

  const handleUserDeleted = () => {
    refreshUtils.afterDeleteUser();
  };

  const handleMediaUploaded = () => {
    refreshUtils.afterUploadMedia();
  };

  const handleMediaDeleted = () => {
    refreshUtils.afterDeleteMedia();
  };

  window.addEventListener(REFRESH_EVENTS.POST_CREATED, handlePostCreated);
  window.addEventListener(REFRESH_EVENTS.POST_UPDATED, handlePostUpdated);
  window.addEventListener(REFRESH_EVENTS.POST_DELETED, handlePostDeleted);
  window.addEventListener(REFRESH_EVENTS.USER_CREATED, handleUserCreated);
  window.addEventListener(REFRESH_EVENTS.USER_UPDATED, handleUserUpdated);
  window.addEventListener(REFRESH_EVENTS.USER_DELETED, handleUserDeleted);
  window.addEventListener(REFRESH_EVENTS.MEDIA_UPLOADED, handleMediaUploaded);
  window.addEventListener(REFRESH_EVENTS.MEDIA_DELETED, handleMediaDeleted);

  // Return cleanup function
  return () => {
    window.removeEventListener(REFRESH_EVENTS.POST_CREATED, handlePostCreated);
    window.removeEventListener(REFRESH_EVENTS.POST_UPDATED, handlePostUpdated);
    window.removeEventListener(REFRESH_EVENTS.POST_DELETED, handlePostDeleted);
    window.removeEventListener(REFRESH_EVENTS.USER_CREATED, handleUserCreated);
    window.removeEventListener(REFRESH_EVENTS.USER_UPDATED, handleUserUpdated);
    window.removeEventListener(REFRESH_EVENTS.USER_DELETED, handleUserDeleted);
    window.removeEventListener(REFRESH_EVENTS.MEDIA_UPLOADED, handleMediaUploaded);
    window.removeEventListener(REFRESH_EVENTS.MEDIA_DELETED, handleMediaDeleted);
  };
}
