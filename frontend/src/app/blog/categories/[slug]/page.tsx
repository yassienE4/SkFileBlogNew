import { fetchPostsByCategory, fetchCategories } from '@/lib/api';
import { BlogPostCard } from '@/components/blog-post-card';
import { CategoriesSection } from '@/components/categories-section';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1');
  const pageSize = 12;

  try {
    // Fetch data in parallel
    const [postsData, allCategories] = await Promise.all([
      fetchPostsByCategory(slug, currentPage, pageSize),
      fetchCategories(1, 50),
    ]);

    // Find the current category info
    const currentCategory = allCategories.find(category => category.slug === slug);
    
    if (!currentCategory) {
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
                Posts in "{currentCategory.name}"
              </h1>
              <p className="text-xl text-muted-foreground">
                {currentCategory.postCount} {currentCategory.postCount === 1 ? 'post' : 'posts'} in this category
              </p>
            </div>
          </header>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main content */}
            <div className="lg:col-span-3">
              {/* Posts */}
              {postsData.items.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid gap-8 md:grid-cols-2">
                    {postsData.items.map((post) => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {postsData.totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4">
                      {currentPage > 1 && (
                        <Link
                          href={`/blog/categories/${slug}?page=${currentPage - 1}`}
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
                          href={`/blog/categories/${slug}?page=${currentPage + 1}`}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Next
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No posts found
                  </h3>
                  <p className="text-muted-foreground">
                    There are no posts in this category yet.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <CategoriesSection 
                categories={allCategories.filter(category => category.slug !== slug)} 
                title="Other Categories" 
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-12 border-t pt-8">
            <div className="flex justify-between items-center">
              <Link 
                href="/blog/categories"
                className="text-primary hover:underline"
              >
                ← All Categories
              </Link>
              <Link 
                href="/blog"
                className="text-primary hover:underline"
              >
                All Posts →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error fetching category data:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  try {
    const allCategories = await fetchCategories(1, 50);
    const currentCategory = allCategories.find(category => category.slug === slug);
    
    if (!currentCategory) {
      return {
        title: 'Category Not Found | Our Blog',
        description: 'The requested category could not be found.',
      };
    }

    return {
      title: `Posts in "${currentCategory.name}" | Our Blog`,
      description: `Browse all posts in the "${currentCategory.name}" category. ${currentCategory.postCount} ${currentCategory.postCount === 1 ? 'post' : 'posts'} available.`,
    };
  } catch (error) {
    return {
      title: 'Category Not Found | Our Blog',
      description: 'The requested category could not be found.',
    };
  }
}
