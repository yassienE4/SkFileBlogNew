import { refreshToken } from './api';
import { getAuthTokenClient, getRefreshTokenClient, setAuthCookiesClient, clearAuthCookiesClient } from './auth-client';
import { logoutAndRedirect } from './logout';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
  showSessionExpiredMessage = true
): Promise<Response> {
  const token = getAuthTokenClient();
  
  if (!token) {
    if (showSessionExpiredMessage) {
      logoutAndRedirect('Your session expired. Please log in again.');
    } else {
      clearAuthCookiesClient();
    }
    throw new Error('No authentication token available');
  }

  // Add auth header to the request
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  };

  let response: Response;
  
  try {
    response = await fetch(url, authOptions);
  } catch (networkError) {
    // Handle network errors (no internet, server down, etc.)
    throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
  }

  // If token is expired (401) or forbidden (403), try to refresh it
  if (response.status === 401 || response.status === 403) {
    if (isRefreshing) {
      // If already refreshing, wait for it to complete
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            const newAuthOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`,
              },
            };
            // Handle network errors for queued requests too
            fetch(url, newAuthOptions)
              .then(resolve)
              .catch((networkError) => {
                reject(new Error(`Network error in queued request: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`));
              });
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    
    try {
      const currentRefreshToken = getRefreshTokenClient();
      
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshResponse = await refreshToken({ refreshToken: currentRefreshToken });
      
      // Update tokens in cookies
      setAuthCookiesClient(
        refreshResponse.accessToken,
        refreshResponse.refreshToken,
        refreshResponse.user
      );

      isRefreshing = false;
      processQueue(null, refreshResponse.accessToken);

      // Retry the original request with the new token
      const retryAuthOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${refreshResponse.accessToken}`,
        },
      };

      try {
        return await fetch(url, retryAuthOptions);
      } catch (retryError) {
        // If retry also fails due to network issues, throw network error
        throw new Error(`Network error during retry: ${retryError instanceof Error ? retryError.message : 'Unknown network error'}`);
      }
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError as Error);
      
      if (showSessionExpiredMessage) {
        // Use the logout function to handle session expiry
        logoutAndRedirect('Your session expired. Please log in again.');
      } else {
        // Clear auth data silently
        clearAuthCookiesClient();
      }
      
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}

// Helper function for authenticated GET requests
export async function authenticatedGet(url: string, showSessionExpiredMessage = true): Promise<Response> {
  return makeAuthenticatedRequest(url, {
    method: 'GET',
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  }, showSessionExpiredMessage);
}

// Helper function for authenticated POST requests
export async function authenticatedPost(
  url: string,
  data: any,
  showSessionExpiredMessage = true
): Promise<Response> {
  return makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(data),
  }, showSessionExpiredMessage);
}

// Helper function for authenticated PUT requests
export async function authenticatedPut(
  url: string,
  data: any,
  showSessionExpiredMessage = true
): Promise<Response> {
  return makeAuthenticatedRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(data),
  }, showSessionExpiredMessage);
}

// Helper function for authenticated DELETE requests
export async function authenticatedDelete(url: string, showSessionExpiredMessage = true): Promise<Response> {
  return makeAuthenticatedRequest(url, {
    method: 'DELETE',
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  }, showSessionExpiredMessage);
}

// Helper function for authenticated file upload requests
export async function authenticatedFileUpload(
  url: string,
  formData: FormData,
  showSessionExpiredMessage = true
): Promise<Response> {
  return makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      "ngrok-skip-browser-warning": "true",
      // Don't set Content-Type for FormData, let browser set it with boundary
    },
    body: formData,
  }, showSessionExpiredMessage);
}
