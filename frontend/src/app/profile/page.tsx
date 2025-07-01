import { getCurrentUser } from '@/lib/auth-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view this page.
          </p>
          <Link 
            href="/login"
            className="text-primary hover:underline"
          >
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-12">
          <div className="mb-6">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Profile
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your account information
          </p>
        </header>

        {/* Profile Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-lg font-medium">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                  <p className="text-lg font-medium">{user.displayName || 'Not set'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded w-fit">{user.id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="mt-1">
                  <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link 
                  href="/my-posts" 
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium mb-2">My Posts</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your blog posts
                  </p>
                </Link>
                
                <Link 
                  href="/create-post" 
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium mb-2">Create Post</h3>
                  <p className="text-sm text-muted-foreground">
                    Write a new blog post
                  </p>
                </Link>
                
                <Link 
                  href="/blog" 
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium mb-2">Browse Posts</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore all blog posts
                  </p>
                </Link>
                
                <Link 
                  href="/blog/tags" 
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium mb-2">Browse Tags</h3>
                  <p className="text-sm text-muted-foreground">
                    Find posts by topics
                  </p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Profile | Our Blog',
    description: 'Manage your account information and preferences',
  };
}
