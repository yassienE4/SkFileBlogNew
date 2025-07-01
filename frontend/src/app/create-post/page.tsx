'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/lib/api';
import { getCurrentUserClient, getAuthTokenClient } from '@/lib/auth-client';
import { CreatePostRequest } from '@/types/blog';
import { LoginUser } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/protected-route';

function CreatePostForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreatePostRequest>({
    title: '',
    content: '',
    description: '',
    categories: [],
    tags: [],
    status: 0, // 0 = Draft, 1 = Published, 2 = Archived
    customUrl: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<LoginUser | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUserClient();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, status: checked ? 1 : 0 }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addCategory = () => {
    const category = categoryInput.trim();
    if (category && !formData.categories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
      setCategoryInput('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category !== categoryToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleCategoryInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get auth token from cookies
      const authToken = getAuthTokenClient();
      
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await createPost(formData, authToken);
      
      // Redirect to the newly created post
      router.push(`/blog/${response.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Post</h1>
          <p className="text-muted-foreground">
            Share your thoughts and ideas with the community
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-destructive/15 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Enter post title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="A brief summary of your post"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Write your post content here..."
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  rows={12}
                  className="resize-y"
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label htmlFor="categoryInput">Categories</Label>
                <div className="flex gap-2">
                  <Input
                    id="categoryInput"
                    type="text"
                    placeholder="Enter a category and press Enter"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyPress={handleCategoryInputKeyPress}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCategory}
                    disabled={isLoading || !categoryInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.categories.map((category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className="cursor-pointer border-primary/50 text-primary"
                        onClick={() => removeCategory(category)}
                      >
                        {category} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tagInput">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tagInput"
                    type="text"
                    placeholder="Enter a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={isLoading || !tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom URL */}
              <div className="space-y-2">
                <Label htmlFor="customUrl">Custom URL</Label>
                <Input
                  id="customUrl"
                  name="customUrl"
                  type="text"
                  placeholder="custom-post-url"
                  value={formData.customUrl}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              {/* Published Switch */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 1}
                  onCheckedChange={handleSwitchChange}
                  disabled={isLoading}
                />
                <Label htmlFor="status">
                  Publish immediately
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Post'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <ProtectedRoute>
      <CreatePostForm />
    </ProtectedRoute>
  );
}
