'use server';

import { redirect } from 'next/navigation';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth-server';
import { login } from '@/lib/api';

export async function logoutAction() {
  await clearAuthCookies();
  redirect('/');
}

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    const response = await login({ username, password });
    await setAuthCookies(response.accessToken, response.refreshToken, response.user);
    redirect('/');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Login failed');
  }
}
