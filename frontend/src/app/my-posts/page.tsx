'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchRecentPosts, deletePost } from '@/lib/api';
import { getCurrentUserClient, getAuthTokenClient } from '@/lib/auth-client';
import { BlogPost } from '@/types/blog';
import { LoginUser } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlogPostCard } from '@/components/blog-post-card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import Link from 'next/link';
import ProtectedRoute from '@/components/protected-route';

function MyPostsContent() {
  const router = useRouter();
  const [user, setUser] = useState<LoginUser | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUserClient();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadUserPosts(currentUser.id);
  }, [router]);

  const loadUserPosts = async (userId: string) => {
    try {
      // Fetch all posts and filter by current user
      const response = await fetchRecentPosts(1, 100); // Get more posts to find user's posts
      const userPosts = response.items.filter(post => post.authorId === userId);
      setPosts(userPosts);
    } catch (error) {
      console.error('Failed to load user posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (slug: string) => {
    setPostToDelete(slug);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const authToken = getAuthTokenClient();
      if (!authToken) {
        throw new Error('Authentication required');
      }

      await deletePost(postToDelete, authToken);
      
      // Remove the post from the local state
      setPosts(prev => prev.filter(post => post.slug !== postToDelete));
      
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading your posts...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Please log in to view your posts</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-6">
            <Link 
              href="/profile" 
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back to Profile
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Posts</h1>
          <p className="text-muted-foreground">
            Manage your blog posts
          </p>
        </header>

        {/* Posts Management */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Your Posts ({posts.length})</h2>
              <p className="text-muted-foreground">Create, edit, and manage your blog posts</p>
            </div>
            <Link href="/create-post">
              <Button>Create New Post</Button>
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  showActions={true}
                  currentUserId={user.id}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start sharing your thoughts with the community
                </p>
                <Link href="/create-post">
                  <Button>Create Your First Post</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function MyPostsPage() {
  return (
    <ProtectedRoute>
      <MyPostsContent />
    </ProtectedRoute>
  );
}
