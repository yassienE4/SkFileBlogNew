import { Category } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface CategoriesSectionProps {
  categories: Category[];
  title: string;
}

export function CategoriesSection({ categories, title }: CategoriesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Link key={category.id} href={`/blog/categories/${category.slug}`}>
                <Badge 
                  variant="outline" 
                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  {category.name}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({category.postCount})
                  </span>
                </Badge>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No categories available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
