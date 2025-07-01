import { BlogPost } from '@/types/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <Card className="h-full hover:shadow-md transition-all duration-200 group cursor-pointer">
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={post.modifiedDate}>
              {formatDate(post.modifiedDate)}
            </time>
            {post.authorName && (
              <>
                <span>•</span>
                <span>by {post.authorName}</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground">
            {post.description ? (
              <p>{truncateContent(post.description)}</p>
            ) : post.content ? (
              <p>{truncateContent(stripHtml(post.content))}</p>
            ) : (
              <p className="italic">No preview available</p>
            )}
          </div>
          
          {(post.tags.length > 0 || post.categories.length > 0) && (
            <div className="space-y-2">
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{post.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              {post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.categories.slice(0, 2).map((category) => (
                    <Badge key={category} variant="outline" className="text-xs border-primary/50 text-primary">
                      {category}
                    </Badge>
                  ))}
                  {post.categories.length > 2 && (
                    <Badge variant="outline" className="text-xs border-primary/50">
                      +{post.categories.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
