import { fetchPostsByTag, fetchTags } from '@/lib/api';
import { BlogPostCard } from '@/components/blog-post-card';
import { TagsSection } from '@/components/tags-section';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface TagPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1');
  const pageSize = 12;

  try {
    // Fetch data in parallel
    const [postsData, allTags] = await Promise.all([
      fetchPostsByTag(slug, currentPage, pageSize),
      fetchTags(1, 50),
    ]);

    // Find the current tag info
    const currentTag = allTags.find(tag => tag.slug === slug);
    
    if (!currentTag) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <header className="mb-12">
            <div className="mb-6">
              <Link 
                href="/blog" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                ← Back to All Posts
              </Link>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Posts tagged with "{currentTag.name}"
              </h1>
              <p className="text-xl text-muted-foreground">
                {postsData.totalCount} {postsData.totalCount === 1 ? 'post' : 'posts'} found
              </p>
            </div>
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
                          href={`/blog/tags/${slug}?page=${currentPage - 1}`}
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
                          href={`/blog/tags/${slug}?page=${currentPage + 1}`}
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
                  <h3 className="text-lg font-medium mb-2">No posts found</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no posts with the "{currentTag.name}" tag yet.
                  </p>
                  <Link 
                    href="/blog"
                    className="text-primary hover:underline"
                  >
                    Browse all posts
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <TagsSection 
                tags={allTags.filter(tag => tag.slug !== slug)} 
                title="Other Tags" 
              />
            </div>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error fetching tag data:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: TagPageProps) {
  const { slug } = await params;
  
  try {
    const allTags = await fetchTags(1, 50);
    const currentTag = allTags.find(tag => tag.slug === slug);
    
    if (!currentTag) {
      return {
        title: 'Tag Not Found | Our Blog',
        description: 'The requested tag could not be found.',
      };
    }

    return {
      title: `Posts tagged "${currentTag.name}" | Our Blog`,
      description: `Browse all posts tagged with "${currentTag.name}". ${currentTag.postCount} ${currentTag.postCount === 1 ? 'post' : 'posts'} available.`,
    };
  } catch (error) {
    return {
      title: 'Tag Not Found | Our Blog',
      description: 'The requested tag could not be found.',
    };
  }
}
