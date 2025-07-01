import { LoginUser } from '@/types/auth';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Client-side operations
export function setAuthCookiesClient(accessToken: string, refreshToken: string, user: LoginUser) {
  // Set cookies on client side
  document.cookie = `${TOKEN_KEY}=${accessToken}; path=/; max-age=${60 * 60 * 1}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
  document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
  document.cookie = `${USER_KEY}=${JSON.stringify(user)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function getCurrentUserClient(): LoginUser | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const userCookie = cookies.find(cookie => cookie.trim().startsWith(`${USER_KEY}=`));
  
  if (!userCookie) return null;
  
  try {
    const userData = userCookie.split('=')[1];
    return JSON.parse(decodeURIComponent(userData));
  } catch {
    return null;
  }
}

export function clearAuthCookiesClient() {
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${USER_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getAuthTokenClient(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${TOKEN_KEY}=`));
  
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1] || null;
}
