<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# File-Based Blog System

A modern, file-based blog system built with ASP.NET Core 10 Minimal API and a Next.js 14 frontend. This system is designed for robust content publishing, easy administration, and seamless media handling—all without a database.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
    - [Content Management](#content-management)
    - [Authentication \& Authorization](#authentication--authorization)
    - [Frontend Features](#frontend-features)
    - [Publishing](#publishing)
    - [Technical Requirements](#technical-requirements)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Admin Panel](#admin-panel)
- [Image Upload \& Media Management](#image-upload--media-management)
- [Usage \& Setup](#usage--setup)
- [Development \& Scripts](#development--scripts)
- [Styling \& Design System](#styling--design-system)
- [Error Handling \& Security](#error-handling--security)
- [Browser Support](#browser-support)
- [Checklist](#checklist)


## Overview

This project is a lightweight, production-ready blog platform that stores all content as files in a structured directory tree. It provides a modern, responsive frontend, secure authentication, a powerful admin panel, and advanced media handling, all optimized for SEO and performance.

## Core Features

### Content Management

- **Posts:** Title, description, body, published/modified dates
- **Tags \& Categories:** Metadata for filtering and organization
- **Media:** Upload images and documents with automatic resizing
- **Custom URLs:** Define custom slugs for posts (kebab-case enforced)
- **File Storage:** All content stored on disk, not in a database


### Authentication \& Authorization

- **JWT-based authentication** for API access
- **Role-based permissions:** Admin, Author, Editor
- **Secure login:** Registration, login, session management
- **Protected routes:** Both frontend and backend


### Frontend Features

- **Home page:** Recent posts, tags, and stats
- **All posts:** Paginated list with filters
- **Post details:** Full content, author info, reading time, related tags
- **Tags \& Categories:** Browsable and filterable
- **Responsive design:** Mobile, tablet, desktop layouts
- **Dark mode:** Default with neutral colors
- **SEO optimized:** Meta tags, Open Graph, structured data


### Publishing

- **Drafts \& scheduled publishing**
- **XML feeds:** RSS and Atom
- **Error handling:** 404 pages, API error fallbacks


### Technical Requirements

- **Backend:** ASP.NET Core 10 Minimal API (file-based, no DB)
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Markdown or HTML** for content editing
- **Optimized asset delivery:** Images, CSS, JS


## Project Structure

```
/content
  /posts
    /YYYY-MM-DD-post-slug/
      meta.json       # Post metadata
      content.md      # Markdown content
      /assets/        # Post-specific images/files
  /users
    /username/
      profile.json    # User info and roles
  /categories
    category-name.json  # Category metadata
  /tags
    tag-name.json       # Tag metadata
/config
  site.json           # Site configuration
  routes.json         # Custom route mappings
/frontend
  /src
    /app
      layout.tsx      # Root layout
      page.tsx        # Home page
      /blog
        page.tsx      # All posts
        [slug]/       # Post details
        tags/         # Tag index
        tags/[slug]/  # Posts by tag
    /components
      blog-post-card.tsx
      tags-section.tsx
      categories-section.tsx
      loading-skeletons.tsx
      ui/
    /lib
      api.ts
    /types
      blog.ts
      media.ts
```


## API Endpoints

### Authentication

- `POST /api/auth/register` – User registration
- `POST /api/auth/login` – User login
- `POST /api/auth/refresh` – Refresh JWT token


### Posts

- `GET /api/posts?page=1&pageSize=10` – Paginated posts
- `GET /api/posts/{slug}` – Single post details
- `POST /api/posts` – Create post (auth required)
- `PUT /api/posts/{slug}` – Update post (auth required)
- `DELETE /api/posts/{slug}` – Delete post (auth required)


### Tags \& Categories

- `GET /api/tags` – All tags
- `GET /api/tags/{slug}/posts?page=1&pageSize=10` – Posts by tag
- `GET /api/categories` – All categories
- `GET /api/categories/{slug}/posts?page=1&pageSize=10` – Posts by category


### Media

- `POST /api/media/upload` – Upload file (auth required)
- `GET /api/media` – List media files
- `GET /api/media/{fileId}` – File info
- `DELETE /api/media/{fileId}` – Delete file
- `GET /media/{filePath}` – Serve file content


### Feeds

- `GET /feed/rss` – RSS feed
- `GET /feed/atom` – Atom feed


### User Management (Admin only)

- `GET /api/users` – List all users (paginated)
- `POST /api/users` – Create user
- `PUT /api/users/{id}/status` – Update user status


## Admin Panel

The admin panel provides comprehensive management for users, posts, and media.

### Features

- **User Management:** View, create, activate/deactivate users, view user info
- **Post Management:** View, edit, delete any post (admin override)
- **Media Management:** View, upload, delete media; bulk operations; search/filter
- **Navigation:** Tabbed interface for Users, Posts, Media
- **Security:** Route protection and role checks (admins cannot deactivate themselves)
- **Components:**
    - `AdminRoute`: Protects admin routes
    - `AdminPanel`: Main interface
    - `Pagination`: Handles large datasets
    - Enhanced `Navbar`: Shows admin link for admins


## Image Upload \& Media Management

### Backend

- **Endpoint:** `POST /api/media/upload` (Bearer token required)
- **Validation:** 10MB limit, supports `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.pdf`, `.doc`, `.docx`
- **Processing:** Automatic resizing (300px, 600px, 1200px widths)
- **Storage:** `/content/media/YYYY-MM/` directory
- **Metadata:** Stored as JSON per file


### Frontend

- **Image Upload Component:** Drag \& drop, browse, preview, filter, delete, copy URL, download
- **Markdown Editor Integration:** Upload/select images directly, auto-insert markdown image syntax
- **Media Library:** Centralized, searchable, filterable
- **Admin Media Page:** Grid view, bulk operations, file info


### File Access

- Direct: `http://localhost:5141/media/{filePath}`
- Metadata: `GET /api/media/{fileId}`


### Security

- Auth required for upload/delete
- User-based access (users see own files, admins see all)


## Usage \& Setup

### Prerequisites

- **Backend:** .NET 10 Preview 4
- **Frontend:** Node.js 18+, Next.js 14, TypeScript, Tailwind CSS


### Running the Project

```bash
# Backend
cd SkFileBlogSystem
dotnet run

# Frontend
cd frontend
npm install
npm run dev
```


### Development Scripts

```bash
npm run dev      # Start frontend dev server
npm run build    # Build frontend for production
npm run start    # Start production server
npm run lint     # Run ESLint checks
```


## Styling \& Design System

- **shadcn/ui** for consistent UI components
- **Tailwind CSS** for utility-first styling
- **Dark mode** as default
- **Responsive layouts** for all devices
- **Smooth transitions** and hover effects


## Error Handling \& Security

- **404 pages** for missing posts/tags
- **API error fallbacks** and skeleton loading states
- **JWT authentication** with HTTP-only cookies
- **Secure route protection** on both client and server
- **Form validation** (client \& server)
- **No sensitive data exposure in errors**


## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+


## Checklist

- [x] Input validation throughout
- [x] Standard C\# and TypeScript conventions
- [x] Kebab-case URLs
- [x] Secure authentication and authorization
- [x] Comprehensive admin panel
- [x] Modern, responsive frontend
- [x] Robust media/image handling
- [x] SEO optimization
- [x] Error handling and user feedback


## File Storage Example

```
/content
  /posts
    /2025-07-09-my-first-post/
      meta.json
      content.md
      /assets/
        image1.jpg
        doc1.pdf
  /media/
    /2025-07/
      {uuid}.jpg
      {uuid}-300w.jpg
      {uuid}-600w.jpg
      {uuid}-1200w.jpg
    /metadata/
      {uuid}.json
```


## TypeScript Interfaces (Frontend)

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

export interface MediaFile {
  id: string;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedDate: string;
  type: MediaType;
  imageMetadata?: ImageMetadata;
}

export enum MediaType {
  Image = 0,
  Document = 1,
  Other = 2
}
```


## Contribution

- Follow standard C\# and TypeScript conventions
- Validate all input
- Use kebab-case for all URLs
- Submit issues and pull requests via the repository

This README consolidates all major features, usage, and technical details for the file-based blog system, reflecting the most up-to-date implementation and best practices.

<div style="text-align: center">⁂</div>

[^1]: ADMIN_PANEL.md

[^2]: BLOG_README.md

[^3]: endpoints.md

[^4]: IMAGE_UPLOAD_IMPLEMENTATION.md

[^5]: README.md

[^6]: https://github.com/DavidAnson/simple-website-with-blog/blob/main/README.md

[^7]: https://github.com/dhiraj-01/Blogging-System/blob/main/README.md

[^8]: https://cubettech.com/resources/blog/the-essential-readme-file-elevating-your-project-with-a-comprehensive-document/

[^9]: https://www.archbee.com/blog/readme-files-guide

[^10]: https://idiomdrottning.org/README-to-blog

[^11]: https://www.youtube.com/watch?v=puIQhnjOfbc

[^12]: https://github.com/nodes-vapor/admin-panel/blob/master/README.md

[^13]: https://build5nines.com/markdown-how-to-add-images-to-readme-md-on-github/

[^14]: https://versent.com.au/blog/writing-a-good-readme-md-file/

[^15]: https://www.joshwcomeau.com/blog/how-i-built-my-blog/

[^16]: https://github.com/Youssef-001/admin-panel/blob/main/README.md

[^17]: https://stackoverflow.com/questions/14494747/how-to-add-images-to-readme-md-on-github

[^18]: https://blog.readme.com/automate-your-documentation/

[^19]: https://nextjs.org/learn/pages-router/data-fetching-blog-data

[^20]: https://dash.readme.com/login

[^21]: https://cloudinary.com/guides/web-performance/4-ways-to-add-images-to-github-readme-1-bonus-method

[^22]: https://www.sanity.io/blog/build-your-own-blog-with-sanity-and-next-js

[^23]: https://docs.readme.com/main/docs/manage-team

[^24]: https://www.rubydoc.info/gems/simple-image-uploader/0.1.5

[^25]: https://github.com/haf/Next-js-Blog/blob/master/README.md

