# Data Refresh System Documentation

## Overview

This data refresh system ensures that your blog frontend always displays up-to-date information whenever data changes occur (create, edit, delete operations). The system combines Next.js cache invalidation with client-side refresh mechanisms.

## Key Components

### 1. Cache Tags (`CACHE_TAGS`)
Defined in `src/lib/data-refresh.ts`, these tags are used to identify different types of cached data:

- `POSTS` - All posts data
- `POST_DETAIL` - Individual post details
- `TAGS` - Blog tags
- `CATEGORIES` - Blog categories  
- `USERS` - User data (admin)
- `MEDIA` - Media files
- `RECENT_POSTS` - Recent posts specifically
- `USER_POSTS` - User-specific posts
- `POSTS_BY_TAG` - Posts filtered by tag
- `POSTS_BY_CATEGORY` - Posts filtered by category

### 2. Server Actions (`src/lib/cache-actions.ts`)
Server actions for cache invalidation:

- `invalidatePostsCache()` - Invalidates all post-related cache
- `invalidatePostDetailCache(slug)` - Invalidates specific post cache
- `invalidateTagsCache()` - Invalidates tags cache
- `invalidateCategoriesCache()` - Invalidates categories cache
- `invalidateUsersCache()` - Invalidates users cache
- `invalidateAfterPostMutation(slug?)` - Comprehensive post mutation invalidation

### 3. Client-Side Refresh Manager (`DataRefreshManager`)
A singleton class that manages client-side data refresh subscriptions:

```typescript
const manager = DataRefreshManager.getInstance();

// Subscribe to refresh events
const unsubscribe = manager.subscribe('posts', () => {
  // Refresh logic here
});

// Notify subscribers
manager.notify('posts');
```

### 4. Refresh Hooks (`src/lib/refresh-hooks.ts`)
React hooks for easy integration:

```typescript
// Auto-refresh hook
const { refreshAfterPostMutation, forceRefresh } = useAutoRefresh();

// Posts refresh hook
usePostsRefresh(() => {
  // Callback when posts data changes
  loadPosts();
});

// Specific post detail refresh
usePostDetailRefresh(slug, () => {
  // Refresh post detail
});
```

### 5. Enhanced API Functions
All mutation API functions now automatically trigger cache invalidation:

- `createPost()` - Creates post + invalidates cache
- `updatePost()` - Updates post + invalidates cache
- `deletePost()` - Deletes post + invalidates cache

## Implementation Guide

### Step 1: API Functions (Already Implemented)
API functions in `src/lib/api.ts` have been enhanced with:
- Cache tags for data fetching
- Automatic cache invalidation after mutations

### Step 2: Server Components
Server components automatically benefit from cache invalidation through Next.js `revalidateTag()`.

### Step 3: Client Components
For client components that need real-time updates:

```typescript
import { usePostsRefresh } from '@/lib/refresh-hooks';

function MyComponent() {
  const [posts, setPosts] = useState([]);
  
  // Auto-refresh when posts change
  usePostsRefresh(() => {
    loadPosts();
  });
  
  const loadPosts = async () => {
    // Fetch updated posts
    const newPosts = await fetchRecentPosts();
    setPosts(newPosts.items);
  };
  
  return (
    // Your component JSX
  );
}
```

### Step 4: Mutation Operations
In components that perform mutations:

```typescript
import { useAutoRefresh } from '@/lib/refresh-hooks';

function CreatePostComponent() {
  const { refreshAfterPostMutation } = useAutoRefresh();
  
  const handleCreatePost = async (data) => {
    try {
      const newPost = await createPost(data, authToken);
      
      // Automatic cache invalidation is handled by the API function
      // But you can also manually trigger refresh
      await refreshAfterPostMutation(newPost.slug);
      
      // Navigate to the new post
      router.push(`/blog/${newPost.slug}`);
    } catch (error) {
      // Handle error
    }
  };
}
```

## Current Implementation Status

### ✅ Completed
- Data refresh utility classes and functions
- Server actions for cache invalidation
- Enhanced API functions with cache tags
- React hooks for easy integration
- Global event system
- Updated create/edit/delete post components
- Updated admin panel with stable refresh system
- Updated my-posts page
- Fixed constant refresh issues in admin panel
- Added specialized admin hooks for stable data management

### 🔄 In Progress
- Integration with remaining components
- Testing and validation

### 📋 Next Steps
1. Update remaining components (navbar, blog cards, etc.)
2. Test the system thoroughly
3. Add error handling and fallbacks
4. Optimize performance

## Usage Examples

### Basic Usage
```typescript
// In a component that displays posts
function PostsList() {
  const [posts, setPosts] = useState([]);
  
  usePostsRefresh(() => {
    fetchRecentPosts().then(data => setPosts(data.items));
  });
  
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### After Mutation
```typescript
// In a component that performs mutations
function PostActions({ slug }) {
  const { refreshAfterPostMutation } = useAutoRefresh();
  
  const handleDelete = async () => {
    await deletePost(slug, authToken);
    // Cache invalidation is automatic
    // Navigate away from deleted post
    router.push('/blog');
  };
}
```

### Custom Refresh Logic
```typescript
// For custom refresh requirements
function CustomComponent() {
  const { subscribe, refreshFunctions } = useDataRefresh();
  
  useEffect(() => {
    const unsubscribe = subscribe('posts', () => {
      // Custom refresh logic
      customRefreshFunction();
    });
    
    return unsubscribe;
  }, []);
}
```

## Benefits

1. **Automatic Updates**: Data refreshes automatically after mutations
2. **Real-time Sync**: Multiple components stay in sync
3. **Performance**: Only refreshes when necessary
4. **Developer Experience**: Easy to implement with hooks
5. **Comprehensive**: Covers all data types and operations
6. **Scalable**: Can be extended for new data types

## Troubleshooting

### Cache Not Invalidating
- Check if cache tags are properly set in API functions
- Verify server actions are being called
- Ensure components are subscribed to correct events

### Performance Issues
- Use specific refresh hooks instead of global ones
- Implement debouncing for frequent updates
- Consider using React.memo for expensive re-renders

### Missing Updates
- Verify components are subscribed to refresh events
- Check if mutation functions are calling cache invalidation
- Ensure DataRefreshProvider is wrapping the app

### Constant Refreshing (Fixed)
The admin panel was experiencing constant refreshing due to unstable dependency arrays in useEffect hooks. This has been fixed by:

1. **Creating stable hooks** (`src/lib/admin-hooks.ts`):
   - `useAdminDataRefresh`: Stable subscription to data refresh events
   - `useDebounceDataLoader`: Debounced data loading to prevent excessive API calls
   - `useAdminDataLoader`: Stable data loading with proper dependency management

2. **Improved dependency management**:
   - Using `useRef` to keep function references stable
   - Proper separation of initial load and refresh event subscriptions
   - Debounced refresh events to prevent excessive API calls

3. **Fixed useDataRefresh hook**:
   - Made the returned object stable by using empty dependency array
   - Since DataRefreshManager is a singleton, it doesn't need to be a dependency

If you experience constant refreshing in other components, apply similar patterns:
```typescript
// Instead of direct useDataRefresh
const { subscribe } = useDataRefresh();

// Use stable subscriptions
useEffect(() => {
  const unsubscribe = subscribe('posts', stableCallback);
  return unsubscribe;
}, [/* only essential dependencies */]);
```

This system provides a robust foundation for keeping your blog data fresh and synchronized across all components.
