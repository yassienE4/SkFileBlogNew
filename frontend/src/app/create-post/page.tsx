'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/lib/api';
import { invalidateAfterPostMutation } from '@/lib/cache-actions';
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
import { MarkdownPreview } from '@/components/markdown-preview';
import ProtectedRoute from '@/components/protected-route';

function CreatePostForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreatePostRequest>({
    title: '',
    content: '',
    description: '',
    categories: [],
    tags: [],
    status: 0, // 1 = published, 2 = scheduled
    customUrl: '',
    scheduledDate: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [user, setUser] = useState<LoginUser | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUserClient();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const validateTitle = (title: string): string | null => {
    if (!title.trim()) {
      return 'Title is required';
    }
    
    // Check if first character is a letter
    if (!/^[a-zA-Z]/.test(title.trim())) {
      return 'Title must start with a letter (A-Z or a-z)';
    }
    
    // Check for invalid characters that would cause URL issues
    const invalidChars = /[<>:"\\|?*]/;
    if (invalidChars.test(title)) {
      return 'Title cannot contain the following characters: < > : " \\ | ? *';
    }
    
    // Check if title starts with a dot
    if (title.trim().startsWith('.')) {
      return 'Title cannot start with a dot (.)';
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate title field
    if (name === 'title') {
      const titleValidationError = validateTitle(value);
      setTitleError(titleValidationError);
    }
    
    if (error) setError(null);
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, status: checked ? 1 : 2 }));
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
      // Validate title before submission
      const titleValidationError = validateTitle(formData.title);
      if (titleValidationError) {
        setTitleError(titleValidationError);
        setError('Please fix the title validation errors before submitting.');
        return;
      }

      // Get auth token from cookies
      const authToken = getAuthTokenClient();
      
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const createData = { ...formData };
      if (createData.scheduledDate === '') {
        createData.scheduledDate = undefined;
      }
      
      if(createData.scheduledDate && createData.status == 0) {createData.status =2;} // Set to scheduled if date is provided
      
      const response = await createPost(createData, authToken);
      
      // Trigger cache invalidation for comprehensive data refresh
      await invalidateAfterPostMutation(response.slug);
      
      // Redirect to the newly created post
      router.push(`/blog/${response.slug}`);
      router.refresh(); // Force refresh to ensure updated data is shown
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
                  className={titleError ? 'border-destructive focus:border-destructive' : ''}
                />
                {titleError && (
                  <p className="text-sm text-destructive">{titleError}</p>
                )}
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
              <MarkdownPreview
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                showPreview={true}
              />

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

              {/* Scheduled Date */}
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Schedule for Later</Label>
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to publish immediately when status is set to "Published"
                </p>
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
                  disabled={isLoading || !!titleError}
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
