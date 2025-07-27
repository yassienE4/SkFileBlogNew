import { clearAuthCookiesClient } from './auth-client';

export function logoutAndRedirect(message?: string) {
  // Clear auth data
  clearAuthCookiesClient();
  
  // Show message if provided
  if (message) {
    alert(message);
  }
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
