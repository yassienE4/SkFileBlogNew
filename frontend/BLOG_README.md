# Blog System - Complete Implementation

A modern, responsive blog system built with Next.js 14, TypeScript, and shadcn/ui components.

## 🚀 Features

### Core Pages
- **Home Page** (`/`) - Blog homepage with recent posts, tags, and stats
- **All Posts** (`/blog`) - Paginated list of all blog posts  
- **Post Details** (`/blog/[slug]`) - Individual post pages with full content
- **Browse Tags** (`/blog/tags`) - Index of all available tags
- **Posts by Tag** (`/blog/tags/[slug]`) - Posts filtered by specific tag
- **About Page** (`/about`) - Information about the blog

### Technical Features
- **Server-Side Rendering**: All pages are server components for optimal SEO
- **Dynamic Routing**: Automatic slug-based routing for posts and tags
- **Error Handling**: Proper 404 pages and error boundaries
- **Loading States**: Skeleton components for better UX
- **Responsive Design**: Works seamlessly on all device sizes
- **Dark Mode**: Built-in dark mode with neutral colors
- **TypeScript**: Fully typed with comprehensive interfaces

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Home page
│   ├── about/
│   │   └── page.tsx            # About page
│   └── blog/
│       ├── page.tsx            # All posts page
│       ├── [slug]/
│       │   ├── page.tsx        # Individual post page
│       │   └── not-found.tsx   # Post not found page
│       └── tags/
│           ├── page.tsx        # All tags page
│           └── [slug]/
│               └── page.tsx    # Posts by tag page
├── components/
│   ├── blog-post-card.tsx      # Post preview card
│   ├── tags-section.tsx        # Tags display component
│   ├── categories-section.tsx  # Categories display
│   ├── loading-skeletons.tsx   # Loading states
│   └── ui/                     # shadcn/ui components
├── lib/
│   └── api.ts                  # API functions
└── types/
    └── blog.ts                 # TypeScript interfaces
```

## TypeScript Interfaces

```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  authorId: string;
  authorName: string;
  publishedDate: string;
  modifiedDate: string;
  status: number;
  scheduledDate: string | null;
  tags: string[];
  categories: string[];
  customUrl: string | null;
  assets: any[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## API Endpoints

The application expects these API endpoints to be available:

- `GET /api/posts?page=1&pageSize=10` - Get paginated blog posts
- `GET /api/tags?page=1&pageSize=10` - Get tags with post counts
- `GET /api/tags/{slug}/posts?page=1&pageSize=10` - Get posts by tag

## Usage

1. Ensure your API server is running on `http://localhost:5141`
2. The home page will automatically fetch and display:
   - 6 most recent blog posts
   - Popular tags (up to 15)
   - Categories (up to 10)
   - Blog statistics

## Features Implemented

✅ Server-side data fetching  
✅ Responsive grid layout  
✅ Blog post cards with hover effects  
✅ Tags and categories sections  
✅ Blog statistics sidebar  
✅ Error handling with fallback UI  
✅ TypeScript interfaces for all entities  
✅ Dark mode support  
✅ Minimal, clean design  
✅ Loading skeletons  
✅ Navigation links  

## Styling

The application uses:
- **shadcn/ui** components for consistent design
- **Tailwind CSS** for styling
- **Dark mode** as default with neutral colors
- **Responsive design** with mobile-first approach
- **Hover effects** and smooth transitions for better UX

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   └── page.tsx            # Home page (server component)
├── components/
│   ├── blog-post-card.tsx  # Blog post preview card
│   ├── tags-section.tsx    # Tags display component
│   ├── categories-section.tsx # Categories display
│   ├── loading-skeletons.tsx  # Loading states
│   └── ui/                 # shadcn/ui components
├── lib/
│   └── api.ts              # API functions
└── types/
    └── blog.ts             # TypeScript interfaces
```

## 🎨 Design System

### UI Components
- **Cards**: Clean post previews with hover effects
- **Badges**: Tag and category indicators
- **Navigation**: Responsive header with breadcrumbs
- **Typography**: Optimized reading experience
- **Spacing**: Consistent layout patterns

### Color Scheme
- Dark mode by default with neutral colors
- Muted backgrounds for better readability
- Primary accent colors for interactive elements
- Semantic colors for different content types

## 📡 API Integration

### Required Endpoints
```
GET /api/posts?page=1&pageSize=10          # Paginated posts
GET /api/posts/{slug}                      # Single post by slug
GET /api/tags?page=1&pageSize=10           # Tags with post counts
GET /api/tags/{slug}/posts?page=1&pageSize=10  # Posts by tag
```

### API Functions
- `fetchRecentPosts(page, pageSize)` - Get paginated posts
- `fetchPostBySlug(slug)` - Get single post
- `fetchTags(page, pageSize)` - Get tags with counts
- `fetchPostsByTag(slug, page, pageSize)` - Get posts by tag

## 🔧 Component Details

### BlogPostCard
- Post title with truncation
- Publication date and author
- Content preview (150 chars)
- Tag badges (max 3 shown)
- Hover effects and transitions
- Click-through to full post

### Post Details Page
- Full post content with typography
- Author and publication info
- Reading time estimation
- Related tags and categories
- Navigation breadcrumbs
- SEO-optimized metadata

### Tags System
- Clickable tag badges
- Post count indicators
- Tag index page
- Filtered post views
- Responsive tag clouds

## 🚦 Navigation Flow

```
Home (/) 
├── All Posts (/blog)
│   └── Individual Post (/blog/[slug])
├── Browse Tags (/blog/tags)
│   └── Posts by Tag (/blog/tags/[slug])
└── About (/about)
```

## ⚡ Performance Features

- **Server Components**: Fast initial page loads
- **Parallel Data Fetching**: Multiple API calls in parallel
- **Optimized Images**: Next.js Image component
- **Static Generation**: Pre-rendered pages where possible
- **Error Boundaries**: Graceful error handling
- **Loading States**: Skeleton screens during data fetching

## 🎯 SEO Optimization

- Dynamic meta titles and descriptions
- Open Graph tags for social sharing
- Structured data for blog posts
- Semantic HTML structure
- Optimized URLs with slugs
- Proper heading hierarchy

## 🛠 Development

### Prerequisites
- Node.js 18+
- Next.js 14
- TypeScript
- Tailwind CSS
- API server running on `localhost:5141`

### Installation
```bash
npm install
npm run dev
```

### Available Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

## 📱 Responsive Design

- **Mobile**: Stacked layout, condensed navigation
- **Tablet**: 2-column post grid, collapsible sidebar
- **Desktop**: 3-column layout with sidebar
- **Touch**: Optimized touch targets and interactions

## 🔒 Error Handling

- **404 Pages**: Custom not-found pages for posts and tags
- **API Errors**: Graceful fallbacks with retry options
- **Loading States**: Skeleton screens during data fetching
- **Network Issues**: Offline-friendly error messages

## 🎭 User Experience

- **Fast Navigation**: Instant page transitions
- **Reading Progress**: Visual reading time indicators
- **Hover States**: Interactive feedback on all clickable elements
- **Accessibility**: ARIA labels and keyboard navigation
- **Typography**: Optimized line heights and spacing for readability

## 🔐 Authentication System

### Features
- **User Registration**: Complete signup flow with validation
- **User Login**: Secure authentication with JWT tokens
- **Cookie Management**: HTTP-only cookies for security
- **Protected Routes**: Server-side route protection
- **Session Management**: Automatic token handling
- **Form Validation**: Client-side and server-side validation
- **Error Handling**: Comprehensive error messages

### Authentication Flow

1. **Registration** (`/register`)
   - User fills out registration form
   - Client-side validation
   - API call to register endpoint
   - Redirect to login page on success

2. **Login** (`/login`)
   - User enters credentials
   - API authentication
   - JWT tokens stored in HTTP-only cookies
   - Redirect to home page
   - Navbar updates to show user state

3. **Session Management**
   - Automatic token validation
   - Persistent login across browser sessions
   - Logout clears all authentication data

### Protected Pages
- **Profile Page** (`/profile`) - Requires authentication
- Uses server-side authentication checking
- Automatic redirect to login if not authenticated

### API Endpoints Used
```
POST /api/auth/register - User registration
POST /api/auth/login    - User authentication
```

### Security Features
- HTTP-only cookies prevent XSS attacks
- Secure cookie settings in production
- Client-side state synchronization
- Proper error handling without exposing sensitive data

### Components
- `Navbar` - Shows different states based on authentication
- `ProtectedRoute` - Wrapper for authenticated-only content
- Form validation with real-time feedback
- Loading states and error handling

## 📊 Features Implemented

✅ **Core Pages**
- Home page with recent posts
- All posts with pagination  
- Individual post pages
- Tag browsing and filtering
- About page

✅ **Navigation**
- Responsive header
- Breadcrumb navigation
- Cross-page linking
- Back/forward navigation

✅ **Content Display**
- Post previews with metadata
- Full post content rendering
- Tag and category systems
- Reading time estimation

✅ **Technical**
- Server-side rendering
- TypeScript interfaces
- Error handling
- Loading states
- SEO optimization
- Dark mode support

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

This blog system provides a complete, production-ready solution for content publishing with modern web technologies and best practices.
