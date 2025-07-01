import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function BlogPostCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="h-6 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
          <div className="h-6 w-12 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TagsSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 w-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
