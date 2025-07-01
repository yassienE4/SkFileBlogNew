import { BlogPostsResponse, TagsResponse, CategoriesResponse, BlogPost, CreatePostRequest, CreatePostResponse, UpdatePostRequest } from '@/types/blog';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse } from '@/types/auth';

const BASE_URL = 'http://localhost:5141/api';

export async function fetchRecentPosts(page: number = 1, pageSize: number = 10): Promise<BlogPostsResponse> {
  console.log(`Fetching posts: page=${page}, pageSize=${pageSize}`);
  const response = await fetch(`${BASE_URL}/posts?page=${page}&pageSize=${pageSize}`, {
    cache: 'no-store', // Keep no cache for now to debug
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  
  const data = await response.json();
  console.log('Posts API response:', data);
  return data;
}

export async function fetchTags(page: number = 1, pageSize: number = 10): Promise<TagsResponse> {
  const response = await fetch(`${BASE_URL}/tags?page=${page}&pageSize=${pageSize}`, {
    cache: 'no-store', // Disable cache temporarily to get fresh data
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  
  return response.json();
}

export async function fetchCategories(page: number = 1, pageSize: number = 10): Promise<CategoriesResponse> {
  const response = await fetch(`${BASE_URL}/categories?page=${page}&pageSize=${pageSize}`, {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return response.json();
}

export async function fetchPostsByTag(tagSlug: string, page: number = 1, pageSize: number = 10): Promise<BlogPostsResponse> {
  const response = await fetch(`${BASE_URL}/tags/${tagSlug}/posts?page=${page}&pageSize=${pageSize}`, {
    cache: 'no-store', // Disable cache temporarily to get fresh data
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch posts for tag: ${tagSlug}`);
  }
  
  return response.json();
}

export async function fetchPostsByCategory(categorySlug: string, page: number = 1, pageSize: number = 10): Promise<BlogPostsResponse> {
  const response = await fetch(`${BASE_URL}/categories/${categorySlug}/posts?page=${page}&pageSize=${pageSize}`, {
    cache: 'no-store', // Disable cache temporarily to get fresh data
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch posts for category: ${categorySlug}`);
  }
  
  return response.json();
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost> {
  const response = await fetch(`${BASE_URL}/posts/${slug}`, {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${slug}`);
  }
  
  return response.json();
}

// Post creation API
export async function createPost(data: CreatePostRequest, authToken: string): Promise<CreatePostResponse> {
  const response = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create post: ${errorData}`);
  }

  return response.json();
}

// Post update API
export async function updatePost(slug: string, data: UpdatePostRequest, authToken: string): Promise<BlogPost> {
  const response = await fetch(`${BASE_URL}/posts/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update post: ${errorData}`);
  }

  return response.json();
}

// Post deletion API
export async function deletePost(slug: string, authToken: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/posts/${slug}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to delete post: ${errorData}`);
  }
}

// Authentication API functions
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  }
  
  return response.json();
}
