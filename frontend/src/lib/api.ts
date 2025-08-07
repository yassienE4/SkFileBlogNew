import { BlogPostsResponse, TagsResponse, CategoriesResponse, BlogPost, CreatePostRequest, CreatePostResponse, UpdatePostRequest } from '@/types/blog';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, UsersResponse, CreateUserRequest, User } from '@/types/auth';
import { MediaFile } from '@/types/media';
import { CACHE_TAGS } from './data-refresh';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, authenticatedFileUpload } from './auth-interceptor';

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Helper function to get the media base URL - now uses frontend proxy
export const getMediaBaseUrl = () => {
  // Use the frontend domain for media URLs to avoid ngrok URL changes
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For SSR, use the environment variable or default to localhost
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
};

// Helper function to get the feed URL
export const getFeedUrl = () => {
  const baseUrl = BASE_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}/feed/atom`;
};

export async function fetchRecentPosts(page: number = 1, pageSize: number = 10): Promise<BlogPostsResponse> {
  console.log(`Fetching posts: page=${page}, pageSize=${pageSize}`);
  const response = await fetch(`${BASE_URL}/posts?page=${page}&pageSize=${pageSize}`, {
    next: { 
      revalidate: 300, // Revalidate every 5 minutes
      tags: [CACHE_TAGS.POSTS, CACHE_TAGS.RECENT_POSTS],
    },
    headers: {
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  } 
  // const rawResponse = await response.text();
  // console.log('Raw posts API response:', rawResponse);
  const data = await response.json();
  return data;
}

export async function searchPosts(query: string, page: number = 1, pageSize: number = 10): Promise<BlogPostsResponse> {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }
  
  const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`, {
    headers: {
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to search posts');
  }
  
  const data = await response.json();
  return data;
}

export async function fetchTags(page: number = 1, pageSize: number = 10): Promise<TagsResponse> {
  const response = await fetch(`${BASE_URL}/tags?page=${page}&pageSize=${pageSize}`, {
    next: { 
      revalidate: 600, // Revalidate every 10 minutes
      tags: [CACHE_TAGS.TAGS],
    },
    headers: {
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  
  return response.json();
}

export async function fetchCategories(page: number = 1, pageSize: number = 10): Promise<CategoriesResponse> {
  const response = await fetch(`${BASE_URL}/categories?page=${page}&pageSize=${pageSize}`, {
    next: { 
      revalidate: 600, // Revalidate every 10 minutes
      tags: [CACHE_TAGS.CATEGORIES],
    },
    headers: {
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return response.json();
}

export async function fetchPostsByTag(tagSlug: string, page: number = 1, pageSize: number = 10): Promise<BlogPostsResponse> {
  const response = await fetch(`${BASE_URL}/tags/${tagSlug}/posts?page=${page}&pageSize=${pageSize}`, {
    next: { 
      revalidate: 300, // Revalidate every 5 minutes
      tags: [CACHE_TAGS.POSTS, `${CACHE_TAGS.POSTS_BY_TAG}-${tagSlug}`],
    },
    headers: {
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch posts for tag: ${tagSlug}`);
  }
  
  return response.json();
}

export async function fetchPostsByCategory(categorySlug: string, page: number = 1, pageSize: number = 10): Promise<BlogPostsResponse> {
  const response = await fetch(`${BASE_URL}/categories/${categorySlug}/posts?page=${page}&pageSize=${pageSize}`, {
    next: { 
      revalidate: 300, // Revalidate every 5 minutes
      tags: [CACHE_TAGS.POSTS, `${CACHE_TAGS.POSTS_BY_CATEGORY}-${categorySlug}`],
    },
    headers: {
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch posts for category: ${categorySlug}`);
  }
  
  return response.json();
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost> {
  const response = await fetch(`${BASE_URL}/posts/${slug}`, {
    next: { 
      revalidate: 3600, // Revalidate every hour
      tags: [CACHE_TAGS.POSTS, `${CACHE_TAGS.POST_DETAIL}-${slug}`],
    },
    headers: {
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${slug}`);
  }
  
  return response.json();
}

// Post creation API
export async function createPost(data: CreatePostRequest): Promise<CreatePostResponse> {
  const response = await authenticatedPost(`${BASE_URL}/posts`, data);
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create post: ${errorData}`);
  }
  
  const result = await response.json();
  
  // Trigger cache invalidation after successful creation
  if (typeof window !== 'undefined') {
    // Client-side: trigger cache invalidation
    const { invalidateAfterPostMutation } = await import('./cache-actions');
    await invalidateAfterPostMutation();
  }
  
  return result;
}// Post update API
export async function updatePost(slug: string, data: UpdatePostRequest): Promise<BlogPost> {
  const response = await authenticatedPut(`${BASE_URL}/posts/${slug}`, data);

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update post: ${errorData}`);
  }

  const result = await response.json();
  
  // Trigger cache invalidation after successful update
  if (typeof window !== 'undefined') {
    // Client-side: trigger cache invalidation
    const { invalidateAfterPostMutation } = await import('./cache-actions');
    await invalidateAfterPostMutation(result.slug);
  }

  return result;
}

// Post deletion API
export async function deletePost(slug: string): Promise<void> {
  const response = await authenticatedDelete(`${BASE_URL}/posts/${slug}`);

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to delete post: ${errorData}`);
  }
  
  // Trigger cache invalidation after successful deletion
  if (typeof window !== 'undefined') {
    // Client-side: trigger cache invalidation
    const { invalidateAfterPostMutation } = await import('./cache-actions');
    await invalidateAfterPostMutation(slug);
  }
}

// Authentication API functions
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Registration failed');
  }
  
  return response.json();
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  }
  
  return response.json();
}

export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Token refresh failed');
  }
  
  return response.json();
}

// User Management API functions (Admin only)
export async function fetchAllUsers(page: number = 1, pageSize: number = 10): Promise<UsersResponse> {
  console.log(`Fetching users: page=${page}, pageSize=${pageSize}`);
  
  // Check if we're on client side (no caching for client-side requests)
  if (typeof window !== 'undefined') {
    const response = await authenticatedGet(`${BASE_URL}/users?page=${page}&pageSize=${pageSize}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Users API error:', response.status, errorText);
      throw new Error(errorText || 'Failed to fetch users');
    }

    const data = await response.json();
    console.log('Raw users API response:', data);
    
    // Check if the response is already in the expected format
    if (data.users && typeof data.totalCount === 'number') {
      console.log('Backend returned paginated response');
      return data;
    }
    
    // If the backend returns a simple array, wrap it in the expected format
    const users = Array.isArray(data) ? data : [];
    const totalCount = users.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    console.log(`Backend returned simple array with ${users.length} users`);
    
    // Apply client-side pagination if backend doesn't support it
    const startIndex = (page - 1) * pageSize;
    const pagedUsers = users.slice(startIndex, startIndex + pageSize);
    
    const result = {
      users: pagedUsers,
      totalCount: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages
    };
    
    console.log('Transformed response:', result);
    return result;
  }
  
  // This is server-side - we need to handle this differently
  // For now, throw an error as server-side should use different approach
  throw new Error('fetchAllUsers should not be called server-side without auth token');
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await authenticatedPost(`${BASE_URL}/users`, data);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create user');
  }

  return response.json();
}

export async function updateUserStatus(userId: string, isActive: boolean): Promise<void> {
  const response = await authenticatedPut(`${BASE_URL}/users/${userId}/status`, { isActive });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to update user status');
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const response = await authenticatedDelete(`${BASE_URL}/users/${userId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to delete user');
  }
}

// Media upload API
export async function uploadFile(file: File): Promise<MediaFile> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authenticatedFileUpload(`${BASE_URL}/media/upload`, formData);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload file');
  }

  return response.json();
}

// Get media files for the user
export async function getMediaFiles(): Promise<MediaFile[]> {
  const response = await authenticatedGet(`${BASE_URL}/media`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch media files');
  }

  return response.json();
}

// Delete media file
export async function deleteMediaFile(fileId: string): Promise<void> {
  const response = await authenticatedDelete(`${BASE_URL}/media/${fileId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to delete file');
  }
}
