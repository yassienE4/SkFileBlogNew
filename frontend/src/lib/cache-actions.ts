'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS } from './data-refresh';

// Server action to invalidate cache tags
export async function invalidateCacheTags(tags: string[]) {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch (error) {
      console.error(`Failed to revalidate tag ${tag}:`, error);
    }
  }
}

// Server action to invalidate paths
export async function invalidatePaths(paths: string[]) {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(`Failed to revalidate path ${path}:`, error);
    }
  }
}

// Specific server actions for different data types
export async function invalidatePostsCache() {
  const tags = [
    CACHE_TAGS.POSTS,
    CACHE_TAGS.RECENT_POSTS,
    CACHE_TAGS.USER_POSTS,
  ];
  
  await invalidateCacheTags(tags);
  
  // Also invalidate key paths
  const paths = [
    '/',
    '/blog',
    '/my-posts',
    '/admin',
  ];
  
  await invalidatePaths(paths);
}

export async function invalidatePostDetailCache(slug: string) {
  const tags = [
    `${CACHE_TAGS.POST_DETAIL}-${slug}`,
  ];
  
  await invalidateCacheTags(tags);
  
  const paths = [
    `/blog/${slug}`,
    `/edit-post/${slug}`,
  ];
  
  await invalidatePaths(paths);
}

export async function invalidateTagsCache() {
  const tags = [CACHE_TAGS.TAGS];
  await invalidateCacheTags(tags);
  
  const paths = [
    '/',
    '/blog',
    '/blog/tags',
  ];
  
  await invalidatePaths(paths);
}

export async function invalidateCategoriesCache() {
  const tags = [CACHE_TAGS.CATEGORIES];
  await invalidateCacheTags(tags);
  
  const paths = [
    '/',
    '/blog',
    '/blog/categories',
  ];
  
  await invalidatePaths(paths);
}

export async function invalidateUsersCache() {
  const tags = [CACHE_TAGS.USERS];
  await invalidateCacheTags(tags);
  
  const paths = [
    '/admin',
  ];
  
  await invalidatePaths(paths);
}

export async function invalidateMediaCache() {
  const tags = [CACHE_TAGS.MEDIA];
  await invalidateCacheTags(tags);
  
  const paths = [
    '/admin/media',
  ];
  
  await invalidatePaths(paths);
}

// Combined invalidation for post mutations
export async function invalidateAfterPostMutation(slug?: string) {
  const tags: string[] = [
    CACHE_TAGS.POSTS,
    CACHE_TAGS.RECENT_POSTS,
    CACHE_TAGS.USER_POSTS,
    CACHE_TAGS.TAGS,
    CACHE_TAGS.CATEGORIES,
  ];
  
  if (slug) {
    tags.push(`${CACHE_TAGS.POST_DETAIL}-${slug}`);
  }
  
  await invalidateCacheTags(tags);
  
  const paths = [
    '/',
    '/blog',
    '/my-posts',
    '/admin',
  ];
  
  if (slug) {
    paths.push(`/blog/${slug}`);
    paths.push(`/edit-post/${slug}`);
  }
  
  await invalidatePaths(paths);
}
