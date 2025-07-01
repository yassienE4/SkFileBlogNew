import { fetchTags } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function TagsPage() {
  try {
    const tags = await fetchTags(1, 100); // Get all tags

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
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Browse by Tags
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore our content by topics and themes
            </p>
          </header>

          {/* Tags grid */}
          {tags.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>All Tags ({tags.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tags.map((tag) => (
                    <Link key={tag.id} href={`/blog/tags/${tag.slug}`}>
                      <div className="group p-4 rounded-lg border hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className="group-hover:bg-accent-foreground group-hover:text-accent transition-colors"
                          >
                            {tag.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium mb-2">No tags available</h3>
              <p className="text-muted-foreground">
                Tags will appear here as content is published.
              </p>
            </div>
          )}

          {/* Back navigation */}
          <div className="mt-12 text-center">
            <Link 
              href="/"
              className="text-primary hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error fetching tags:', error);
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Unable to Load Tags</h1>
          <p className="text-muted-foreground mb-6">
            There was an error loading the tags.
          </p>
          <Link 
            href="/blog"
            className="text-primary hover:underline"
          >
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }
}

export async function generateMetadata() {
  return {
    title: 'Browse by Tags | Our Blog',
    description: 'Explore all available tags and topics in our blog',
  };
}
