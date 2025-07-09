import { fetchRecentPosts, fetchTags, fetchCategories, BASE_URL } from '@/lib/api';
import { BlogPostCard } from '@/components/blog-post-card';
import { TagsSection } from '@/components/tags-section';
import { CategoriesSection } from '@/components/categories-section';
import Link from 'next/link';

export default async function Home() {
  try {
    // Fetch data in parallel
    const [postsData, tagsData, categoriesData] = await Promise.all([
      fetchRecentPosts(1, 6), // Get 6 recent posts
      fetchTags(1, 15), // Get top 15 tags
      fetchCategories(1, 10), // Get top 10 categories
    ]);

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Welcome to SK Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the latest insights, stories, and updates from our team.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content - Recent posts */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Recent Posts</h2>
                <Link 
                  href="/blog" 
                  className="text-primary hover:underline text-sm font-medium"
                >
                  View all posts →
                </Link>
              </div>

              {postsData.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {postsData.items.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">
                    Check back later for new content!
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Tags Section */}
              {tagsData.length > 0 && (
                <TagsSection tags={tagsData} title="Popular Tags" />
              )}

              {/* Categories Section */}
              {categoriesData.length > 0 && (
                <CategoriesSection categories={categoriesData} title="Categories" />
              )}

              {/* Blog stats */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Blog Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Posts:</span>
                    <span className="font-medium text-lg">{postsData.totalCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tags:</span>
                    <span className="font-medium">{tagsData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Categories:</span>
                    <span className="font-medium">{categoriesData.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <Link 
                    href="/blog" 
                    className="block text-primary hover:underline"
                  >
                    All Posts
                  </Link>
                  <Link 
                    href="/blog/tags" 
                    className="block text-primary hover:underline"
                  >
                    Browse by Tags
                  </Link>
                  <Link 
                    href="/blog/categories" 
                    className="block text-primary hover:underline"
                  >
                    Browse by Categories
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching blog data:', error);
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Unable to Load Blog</h1>
          <p className="text-muted-foreground mb-6">
            There was an error loading the blog content. This might be because the API server is not running.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Make sure your API server is running on:</p>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {BASE_URL || 'API_BASE_URL not configured'}
            </code>
          </div>
        </div>
      </div>
    );
  }
}
