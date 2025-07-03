'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserClient } from '@/lib/auth-client';
import { LoginUser } from '@/types/auth';
import { Card, CardContent } from '@/components/ui/card';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [user, setUser] = useState<LoginUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUserClient();
    
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    if (currentUser.role !== 'Admin') {
      router.push('/');
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

  if (!user || user.role !== 'Admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
