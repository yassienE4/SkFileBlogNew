import { BlogPostsResponse, TagsResponse, CategoriesResponse, BlogPost, CreatePostRequest, CreatePostResponse, UpdatePostRequest } from '@/types/blog';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, UsersResponse, CreateUserRequest, User } from '@/types/auth';
import { MediaFile } from '@/types/media';

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Helper function to get the media base URL (removes /api from BASE_URL if present)
export const getMediaBaseUrl = () => {
  return BASE_URL.replace(/\/api\/?$/, '');
};
export async function fetchRecentPosts(page: number = 1, pageSize: number = 10): Promise<BlogPostsResponse> {
  console.log(`Fetching posts: page=${page}, pageSize=${pageSize}`);
  const response = await fetch(`${BASE_URL}/posts?page=${page}&pageSize=${pageSize}`, {
    next: { revalidate: 300 }, // Revalidate every 5 minutes
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

export async function fetchTags(page: number = 1, pageSize: number = 10): Promise<TagsResponse> {
  const response = await fetch(`${BASE_URL}/tags?page=${page}&pageSize=${pageSize}`, {
    next: { revalidate: 600 }, // Revalidate every 10 minutes
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
    next: { revalidate: 600 }, // Revalidate every 10 minutes
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
    next: { revalidate: 300 }, // Revalidate every 5 minutes
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
    next: { revalidate: 300 }, // Revalidate every 5 minutes
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
    next: { revalidate: 3600 }, // Revalidate every hour
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
export async function createPost(data: CreatePostRequest, authToken: string): Promise<CreatePostResponse> {
  const response = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
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
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
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
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
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

// User Management API functions (Admin only)
export async function fetchAllUsers(authToken: string, page: number = 1, pageSize: number = 10): Promise<UsersResponse> {
  console.log(`Fetching users: page=${page}, pageSize=${pageSize}`);
  const response = await fetch(`${BASE_URL}/users?page=${page}&pageSize=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
    next: { revalidate: 60 }, // Revalidate every minute for admin data
  });

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

export async function createUser(data: CreateUserRequest, authToken: string): Promise<User> {
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create user');
  }

  return response.json();
}

export async function updateUserStatus(userId: string, isActive: boolean, authToken: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to update user status');
  }
}

export async function deleteUser(userId: string, authToken: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to delete user');
  }
}

// Media upload API
export async function uploadFile(file: File, authToken: string): Promise<MediaFile> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload file');
  }

  return response.json();
}

// Get media files for the user
export async function getMediaFiles(authToken: string): Promise<MediaFile[]> {
  const response = await fetch(`${BASE_URL}/media`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch media files');
  }

  return response.json();
}

// Delete media file
export async function deleteMediaFile(fileId: string, authToken: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/media/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      "ngrok-skip-browser-warning": "true", // Skip ngrok warning in development
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to delete file');
  }
}
