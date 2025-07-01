import { Tag } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface TagsSectionProps {
  tags: Tag[];
  title: string;
}

export function TagsSection({ tags, title }: TagsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/blog/tags/${tag.slug}`}>
              <Badge 
                variant="outline" 
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
              >
                {tag.name}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({tag.postCount})
                </span>
              </Badge>
            </Link>
          ))}
        </div>
        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground">No tags available</p>
        )}
      </CardContent>
    </Card>
  );
}
