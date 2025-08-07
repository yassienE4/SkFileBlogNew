import { fetchRecentPosts, fetchTags, searchPosts } from '@/lib/api';
import { BlogPostCard } from '@/components/blog-post-card';
import { TagsSection } from '@/components/tags-section';
import { SearchBar } from '@/components/search-bar';
import Link from 'next/link';

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page, q } = await searchParams;
  const currentPage = parseInt(page || '1');
  const pageSize = 12;
  const searchQuery = q || '';

  try {
    // Fetch data in parallel
    const [postsData, tagsData] = await Promise.all([
      searchQuery 
        ? searchPosts(searchQuery, currentPage, pageSize)
        : fetchRecentPosts(currentPage, pageSize),
      fetchTags(1, 20),
    ]);

    const isSearchMode = Boolean(searchQuery);

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            
            <div className="mb-6">
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                {isSearchMode ? `Search Results` : 'All Blog Posts'}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {isSearchMode 
                  ? `Found ${postsData.totalCount} result${postsData.totalCount === 1 ? '' : 's'} for "${searchQuery}"`
                  : 'Explore all our articles and insights'
                }
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar 
                placeholder="Search posts by title, content, or tags..."
                className="max-w-2xl"
              />
            </div>

            {/* Show clear search option when in search mode */}
            {isSearchMode && (
              <div className="mb-4">
                <Link 
                  href="/blog"
                  className="text-primary hover:underline text-sm"
                >
                  ← Clear search and show all posts
                </Link>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content */}
            <div className="lg:col-span-3">
              {postsData.items.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {postsData.items.map((post) => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {postsData.totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4">
                      {currentPage > 1 && (
                        <Link
                          href={`/blog?${new URLSearchParams({
                            ...(searchQuery && { q: searchQuery }),
                            page: (currentPage - 1).toString()
                          }).toString()}`}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Previous
                        </Link>
                      )}
                      
                      <span className="text-muted-foreground">
                        Page {currentPage} of {postsData.totalPages}
                      </span>
                      
                      {currentPage < postsData.totalPages && (
                        <Link
                          href={`/blog?${new URLSearchParams({
                            ...(searchQuery && { q: searchQuery }),
                            page: (currentPage + 1).toString()
                          }).toString()}`}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Next
                        </Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">
                    {isSearchMode ? 'No posts found' : 'No posts available'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isSearchMode 
                      ? `No posts match your search for "${searchQuery}". Try different keywords.`
                      : 'Check back later for new content!'
                    }
                  </p>
                  {isSearchMode && (
                    <Link 
                      href="/blog"
                      className="text-primary hover:underline"
                    >
                      View all posts
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {tagsData.length > 0 && (
                <TagsSection tags={tagsData} title="Browse by Tags" />
              )}
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
          <h1 className="text-2xl font-bold mb-4">Unable to Load Posts</h1>
          <p className="text-muted-foreground mb-6">
            There was an error loading the blog posts.
          </p>
          <Link 
            href="/"
            className="text-primary hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
}

export async function generateMetadata({ searchParams }: BlogPageProps) {
  const { q } = await searchParams;
  const searchQuery = q || '';

  if (searchQuery) {
    return {
      title: `Search results for "${searchQuery}" | SK Blog`,
      description: `Search results for "${searchQuery}" on SK Blog`,
    };
  }

  return {
    title: 'All Posts | SK Blog',
    description: 'Browse all our blog posts and articles',
  };
}
