'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUserClient, clearAuthCookiesClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LoginUser } from '@/types/auth';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<LoginUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user authentication on component mount
    const currentUser = getCurrentUserClient();
    setUser(currentUser);
    setIsLoading(false);

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      const updatedUser = getCurrentUserClient();
      setUser(updatedUser);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      clearAuthCookiesClient();
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <h1 className="text-xl font-bold hover:text-primary transition-colors">Our Blog</h1>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                All Posts
              </Link>
              <Link href="/blog/tags" className="text-muted-foreground hover:text-foreground transition-colors">
                Tags
              </Link>
              <Link href="/blog/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                Categories
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
            </div>
          </div>

          {/* Auth section */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link href="/create-post">
                  <Button variant="outline" size="sm">
                    Create Post
                  </Button>
                </Link>
                <div className="hidden sm:block">
                  <span className="text-sm text-muted-foreground">
                    Welcome, <span className="font-medium text-foreground">{user.displayName || user.username}</span>
                  </span>
                  {user.role !== 'User' && (
                    <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                      {user.role}
                    </span>
                  )}
                </div>
                <Link href="/my-posts">
                  <Button variant="ghost" size="sm">
                    My Posts
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
