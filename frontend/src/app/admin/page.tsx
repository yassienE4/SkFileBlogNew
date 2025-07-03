'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/simple-pagination';
import { fetchAllUsers, createUser, fetchRecentPosts, deletePost } from '@/lib/api';
import { getCurrentUserClient, getAuthTokenClient } from '@/lib/auth-client';
import { User, CreateUserRequest } from '@/types/auth';
import { BlogPost } from '@/types/blog';
import { Trash2, Users, FileText, UserPlus, Edit, Eye } from 'lucide-react';
import AdminRoute from '@/components/admin-route';

function AdminPanelContent() {
  const [currentUser, setCurrentUser] = useState(getCurrentUserClient());
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [userPage, setUserPage] = useState(1);
  const [postPage, setPostPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    displayName: '',
    role: 'Author',
  });

  const pageSize = 10;

  useEffect(() => {
    const user = getCurrentUserClient();
    const token = getAuthTokenClient();
    
    setCurrentUser(user);
    setAuthToken(token);
  }, []);

  useEffect(() => {
    if (authToken && currentUser?.role === 'Admin') {
      loadData();
    }
  }, [authToken, currentUser, activeTab, userPage, postPage]);

  const loadData = async () => {
    if (!authToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Always load both counts for tab display, but only load full data for active tab
      const [usersResponse, postsResponse] = await Promise.allSettled([
        fetchAllUsers(authToken, activeTab === 'users' ? userPage : 1, activeTab === 'users' ? pageSize : 1),
        fetchRecentPosts(activeTab === 'posts' ? postPage : 1, activeTab === 'posts' ? pageSize : 1)
      ]);

      // Handle users response
      if (usersResponse.status === 'fulfilled') {
        console.log('Users API Response:', usersResponse.value);
        if (activeTab === 'users') {
          setUsers(usersResponse.value.users || []);
        }
        setTotalUsers(usersResponse.value.totalCount || 0);
      } else {
        console.error('Users API error:', usersResponse.reason);
        if (activeTab === 'users') {
          setError(usersResponse.reason instanceof Error ? usersResponse.reason.message : 'Failed to load users');
        }
      }

      // Handle posts response
      if (postsResponse.status === 'fulfilled') {
        console.log('Posts API Response:', postsResponse.value);
        if (activeTab === 'posts') {
          setPosts(postsResponse.value.items || []);
        }
        setTotalPosts(postsResponse.value.totalCount || 0);
      } else {
        console.error('Posts API error:', postsResponse.reason);
        if (activeTab === 'posts') {
          setError(postsResponse.reason instanceof Error ? postsResponse.reason.message : 'Failed to load posts');
        }
      }
    } catch (err) {
      console.error('Load data error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!authToken) return;
    
    try {
      await createUser(createUserData, authToken);
      setShowCreateUserDialog(false);
      setCreateUserData({
        username: '',
        email: '',
        password: '',
        displayName: '',
        role: 'Author',
      });
      loadData(); // Reload users
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleDeletePost = async (slug: string) => {
    if (!authToken) return;
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deletePost(slug, authToken);
      loadData(); // Reload posts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const userTotalPages = Math.ceil(totalUsers / pageSize);
  const postTotalPages = Math.ceil(totalPosts / pageSize);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users and content</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
          <Button 
            onClick={() => setError(null)}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="mr-2 h-4 w-4" />
            Users ({totalUsers})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="mr-2 h-4 w-4" />
            Posts ({totalPosts})
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">User Management</h2>
            <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. They will be able to log in with these credentials.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">Username</Label>
                    <Input
                      id="username"
                      value={createUserData.username}
                      onChange={(e) => setCreateUserData({ ...createUserData, username: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createUserData.email}
                      onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="displayName" className="text-right">Display Name</Label>
                    <Input
                      id="displayName"
                      value={createUserData.displayName}
                      onChange={(e) => setCreateUserData({ ...createUserData, displayName: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createUserData.password}
                      onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                    <Select value={createUserData.role} onValueChange={(value) => setCreateUserData({ ...createUserData, role: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Author">Author</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateUser}>Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {users && users.length > 0 ? (
                          users.map((user) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-foreground">{user.displayName}</div>
                                  <div className="text-sm text-muted-foreground">@{user.username}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {new Date(user.createdDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                              {error ? 'Failed to load users. Check console for details.' : 'No users found.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {userTotalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={userPage}
                    totalPages={userTotalPages}
                    onPageChange={setUserPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Post Management</h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Author</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Published</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {posts && posts.map((post) => (
                          <tr key={post.id}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-foreground">{post.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">{post.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{post.authorName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={post.status === 1 ? 'default' : post.status === 0 ? 'secondary' : 'outline'}>
                                {post.status === 1 ? 'Published' : post.status === 0 ? 'Draft' : 'Archived'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(post.publishedDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                  <a href={`/blog/${post.slug}`} target="_blank">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  asChild
                                  disabled={currentUser?.id !== post.authorId}
                                  className={currentUser?.id !== post.authorId ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  <a href={currentUser?.id === post.authorId ? `/edit-post/${post.slug}` : '#'}>
                                    <Edit className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeletePost(post.slug)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {postTotalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={postPage}
                    totalPages={postTotalPages}
                    onPageChange={setPostPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  return (
    <AdminRoute>
      <AdminPanelContent />
    </AdminRoute>
  );
}
