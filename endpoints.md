

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/refresh` - Refresh access token

### Posts
- `GET /api/posts?page=1&pageSize=10` - Get paginated posts
- `GET /api/posts/{slug}` - Get single post by slug
- `POST /api/posts` - Create new post (requires auth)
- `PUT /api/posts/{slug}` - Update post (requires auth)
- `DELETE /api/posts/{slug}` - Delete post (requires auth)

### Categories & Tags
- `GET /api/categories` - Get all categories
- `GET /api/categories/{slug}/posts?page=1&pageSize=10` - Get posts by category
- `GET /api/tags` - Get all tags
- `GET /api/tags/{slug}/posts?page=1&pageSize=10` - Get posts by tag

### Search
- `GET /api/search?q=query&page=1&pageSize=10` - Search posts

### Media
- `POST /api/media/upload` - Upload file (requires auth)
- `GET /api/media` - List media files
- `GET /api/media/{fileId}` - Get file info
- `DELETE /api/media/{fileId}` - Delete file
- `GET /media/{filePath}` - Serve file content

### Feeds
- `GET /feed/rss` - RSS feed
- `GET /feed/atom` - Atom feed

### User Management (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

## Authentication

The system uses JWT bearer tokens for authentication. To authenticate:

1. Login via `/api/auth/login` with username/password
2. Receive access token (valid for 1 hour) and refresh token
3. Include access token in Authorization header: `Bearer {token}`
