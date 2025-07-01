import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The blog post you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <Link 
            href="/blog"
            className="block bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            Browse All Posts
          </Link>
          <Link 
            href="/"
            className="block text-primary hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
