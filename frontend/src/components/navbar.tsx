'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUserClient, clearAuthCookiesClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoginUser } from '@/types/auth';
import { User, Settings, FileText, Shield, LogOut, ChevronDown, Rss } from 'lucide-react';
import { getFeedUrl } from '@/lib/api';

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
              <h1 className="text-xl font-bold hover:text-primary transition-colors">SK Blog</h1>
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
              <a 
                href={getFeedUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="RSS Feed"
              >
                <Rss className="h-4 w-4" />
                Feed
              </a>
            </div>
          </div>

          {/* Auth section */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link href="/create-post">
                  <Button variant="outline" size="sm">
                    Create Post
                  </Button>
                </Link>
                
                {/* User info - only show on larger screens */}
                <div className="hidden lg:block">
                  <span className="text-sm text-muted-foreground">
                    Welcome, <span className="font-medium text-foreground">{user.displayName || user.username}</span>
                  </span>
                  {user.role !== 'User' && (
                    <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                      {user.role}
                    </span>
                  )}
                </div>

                {/* User dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.displayName || user.username}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.displayName || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                        {user.role !== 'User' && (
                          <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded w-fit">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/my-posts" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        My Posts
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    {user.role === 'Admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
