import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { LoginUser } from '@/types/auth';

interface ServerProtectedRouteProps {
  children: React.ReactNode;
}

export async function ServerProtectedRoute({ children }: ServerProtectedRouteProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return <>{children}</>;
}

interface ServerAuthenticatedUserProps {
  children: (user: LoginUser) => React.ReactNode;
}

export async function ServerAuthenticatedUser({ children }: ServerAuthenticatedUserProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  return <>{children(user)}</>;
}
