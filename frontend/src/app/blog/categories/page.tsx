import { fetchCategories } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export async function generateMetadata() {
  return {
    title: 'Browse Categories | Our Blog',
    description: 'Browse all blog post categories and discover content by topic.',
  };
}

export default async function CategoriesPage() {
  try {
    const categories = await fetchCategories(1, 100); // Get all categories

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              <h1 className="text-4xl font-bold tracking-tight">Browse Categories</h1>
              <p className="text-xl text-muted-foreground">
                Explore our blog posts organized by category
              </p>
            </div>
          </header>

          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link key={category.id} href={`/blog/categories/${category.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
                        </Badge>
                        <span className="text-primary group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <p>No categories found.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="mt-12 border-t pt-8">
            <div className="flex justify-center">
              <Link 
                href="/blog"
                className="text-primary hover:underline"
              >
                ← Back to All Posts
              </Link>
            </div>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error fetching categories:', error);
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>Failed to load categories. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}
