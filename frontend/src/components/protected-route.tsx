'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserClient } from '@/lib/auth-client';
import { LoginUser } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [user, setUser] = useState<LoginUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUserClient();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}

interface AuthenticatedUserProps {
  children: (user: LoginUser) => React.ReactNode;
}

export function AuthenticatedUser({ children }: AuthenticatedUserProps) {
  const [user, setUser] = useState<LoginUser | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUserClient();
    setUser(currentUser);
  }, []);

  if (!user) {
    return null;
  }

  return <>{children(user)}</>;
}
