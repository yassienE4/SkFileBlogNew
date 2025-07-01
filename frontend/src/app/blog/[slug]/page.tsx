import { fetchPostBySlug } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PostActions } from '@/components/post-actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  try {
    const [post, currentUser] = await Promise.all([
      fetchPostBySlug(slug),
      getCurrentUser()
    ]);

    const isOwner = currentUser && post.authorId === currentUser.id;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatContent = (content: string) => {
      // Split content by line breaks and render as paragraphs
      // Handle both single and double line breaks
      const paragraphs = content.split(/\n\s*\n/);
      
      return paragraphs.map((paragraph, index) => {
        // Skip empty paragraphs
        if (!paragraph.trim()) return null;
        
        // Handle single line breaks within paragraphs
        const lines = paragraph.split('\n').map((line, lineIndex) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < paragraph.split('\n').length - 1 && <br />}
          </span>
        ));
        
        return (
          <p key={index} className="mb-6 leading-relaxed text-lg">
            {lines}
          </p>
        );
      }).filter(Boolean);
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back button */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Main content */}
          <article className="space-y-8">
            {/* Header */}
            <header className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight leading-tight">
                {post.title}
              </h1>
              
              {post.description && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {post.description}
                </p>
              )}

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-6">
                <time dateTime={post.modifiedDate}>
                  Published on {formatDate(post.modifiedDate)}
                </time>
                {post.authorName && (
                  <>
                    <span>•</span>
                    <span>by {post.authorName}</span>
                  </>
                )}
                <span>•</span>
                <span>{Math.ceil(post.content.replace(/\s+/g, ' ').split(' ').length / 200)} min read</span>
              </div>
            </header>

            {/* Post Actions (only shown to post owner) */}
            <PostActions slug={post.slug} isOwner={!!isOwner} />

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="text-foreground leading-relaxed space-y-6">
                {formatContent(post.content)}
              </div>
            </div>

            {/* Tags and Categories */}
            {(post.tags.length > 0 || post.categories.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filed Under</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {post.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Link key={tag} href={`/blog/tags/${tag}`}>
                            <Badge 
                              variant="secondary" 
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              {tag}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {post.categories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {post.categories.map((category) => (
                          <Link key={category} href={`/blog/categories/${category}`}>
                            <Badge 
                              variant="outline" 
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              {category}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="border-t pt-8">
              <div className="flex justify-between items-center">
                <Link 
                  href="/blog"
                  className="text-primary hover:underline"
                >
                  ← All Posts
                </Link>
                <Link 
                  href="/"
                  className="text-primary hover:underline"
                >
                  Back to Home →
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error fetching post:', error);
    notFound();
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  
  try {
    const post = await fetchPostBySlug(slug);
    
    return {
      title: `${post.title} | Our Blog`,
      description: post.description || post.content.substring(0, 160) + '...',
      openGraph: {
        title: post.title,
        description: post.description || post.content.substring(0, 160) + '...',
        type: 'article',
        publishedTime: post.publishedDate,
        modifiedTime: post.modifiedDate,
        authors: post.authorName ? [post.authorName] : undefined,
        tags: post.tags,
      },
    };
  } catch (error) {
    return {
      title: 'Post Not Found | Our Blog',
      description: 'The requested blog post could not be found.',
    };
  }
}
