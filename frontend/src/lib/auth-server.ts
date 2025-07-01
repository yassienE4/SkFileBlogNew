import { cookies } from 'next/headers';
import { LoginUser } from '@/types/auth';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Server-side cookie operations only
export async function setAuthCookies(accessToken: string, refreshToken: string, user: LoginUser) {
  const cookieStore = await cookies();
  
  // Set access token cookie (httpOnly for security)
  cookieStore.set(TOKEN_KEY, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1, // 1 hour
  });
  
  // Set refresh token cookie
  cookieStore.set(REFRESH_TOKEN_KEY, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  // Set user data cookie (not httpOnly so client can access)
  cookieStore.set(USER_KEY, JSON.stringify(user), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value || null;
}

export async function getCurrentUser(): Promise<LoginUser | null> {
  const cookieStore = await cookies();
  const userData = cookieStore.get(USER_KEY)?.value;
  
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  
  cookieStore.delete(TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
  cookieStore.delete(USER_KEY);
}
