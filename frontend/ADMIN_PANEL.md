# Admin Panel Documentation

## Overview
The admin panel provides comprehensive user and content management capabilities for users with admin privileges.

## Features

### User Management
- **View All Users**: See a paginated list of all users with their details
- **Create New Users**: Add new users with specific roles (Author/Admin)
- **User Status Toggle**: Activate/deactivate user accounts
- **User Information**: Display username, email, role, status, and creation date

### Post Management
- **View All Posts**: See all blog posts across the platform
- **Post Actions**: View, edit, and delete any post (admin override)
- **Post Information**: Title, author, status, and publication date
- **Admin Delete**: Admins can delete any post regardless of ownership

### Navigation
- Access via navbar "Admin Panel" link (only visible to admins)
- Protected route - requires admin role
- Tabbed interface for easy switching between users and posts

## API Endpoints Used

### User Management
- `GET /api/users` - Fetch all users (paginated)
- `POST /api/users` - Create new user
- `PUT /api/users/{id}/status` - Update user active status

### Post Management
- `GET /api/posts` - Fetch all posts (existing endpoint)
- `DELETE /api/posts/{slug}` - Delete post (enhanced for admin use)

## Security
- Route protection via `AdminRoute` component
- Client-side role checking
- Server-side authentication required for all API calls
- Admins cannot deactivate themselves

## Usage

1. **Access**: Login with admin credentials, navigate to Admin Panel
2. **User Management**: 
   - Switch to Users tab
   - Create users via "Create User" button
   - Toggle user status with switches
   - View user details in table format
3. **Post Management**:
   - Switch to Posts tab  
   - View all posts in table format
   - Use action buttons to view, edit, or delete posts
   - Admin delete overrides post ownership

## Components
- `AdminRoute`: Protection wrapper for admin-only access
- `AdminPanel`: Main admin interface with tabbed layout
- `Pagination`: Custom pagination for large datasets
- Enhanced `PostActions`: Shows admin controls on individual posts
- Enhanced `Navbar`: Shows admin panel link for admin users

## Types
- `User`: Full user model with all fields
- `UserInfo`: Simplified user info for display
- `CreateUserRequest`: User creation payload
- `UsersResponse`: Paginated user response

The admin panel provides a complete management interface while maintaining security and user experience standards.
