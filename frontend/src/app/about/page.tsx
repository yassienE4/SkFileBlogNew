import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-12">
          <div className="mb-6">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            About SK Blog
          </h1>
          <p className="text-xl text-muted-foreground">
            Learn more about our mission, vision, and the team behind the content
          </p>
        </header>

        {/* Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">
                We're dedicated to sharing valuable insights, stories, and knowledge with our community. 
                SK blog serves as a platform for thought leadership, technical deep-dives, and industry perspectives.
              </p>
              <p className="leading-relaxed">
                Whether you're looking for the latest trends, practical tutorials, or behind-the-scenes stories, 
                we strive to deliver content that informs, educates, and inspires.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What We Cover</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Technical tutorials and best practices</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Industry insights and analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Company updates and announcements</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Team stories and experiences</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Product deep-dives and case studies</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed">
                We love hearing from our readers! If you have questions, suggestions, or would like to 
                contribute content, we'd love to hear from you.
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> blog@ourcompany.com</p>
                <p><strong>Follow us:</strong> Stay updated with our latest posts</p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center space-x-6 pt-8">
            <Link 
              href="/blog"
              className="text-primary hover:underline"
            >
              Browse All Posts
            </Link>
            <Link 
              href="/blog/tags"
              className="text-primary hover:underline"
            >
              Explore Topics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'About | SK Blog',
    description: 'Learn more about our blog, mission, and the team behind the content',
  };
}
