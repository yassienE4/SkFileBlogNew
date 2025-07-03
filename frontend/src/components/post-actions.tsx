'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePost } from '@/lib/api';
import { getCurrentUserClient, getAuthTokenClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import Link from 'next/link';

interface PostActionsProps {
  slug: string;
  isOwner: boolean;
  authorId?: string;
}

export function PostActions({ slug, isOwner, authorId }: PostActionsProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentUser = getCurrentUserClient();
  
  // Check if user is admin or owner
  const canEdit = isOwner;
  const canDelete = isOwner || (currentUser?.role === 'Admin');

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const authToken = getAuthTokenClient();
      if (!authToken) {
        throw new Error('Authentication required');
      }

      await deletePost(slug, authToken);
      
      // Redirect to home page after successful deletion
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 p-4 border rounded-lg bg-muted/30">
        <div className="flex-1">
          <h3 className="font-medium text-sm">Post Management</h3>
          <p className="text-xs text-muted-foreground">
            {isOwner 
              ? "You own this post and can edit or delete it." 
              : "Admin privileges: You can delete this post."}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/edit-post/${slug}`}>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
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
    </>
  );
}
