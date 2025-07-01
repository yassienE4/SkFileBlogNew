namespace SkFileBlogSystem.Models;
public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}


public class Post
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public DateTime? ScheduledDate { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<string> Categories { get; set; } = new();
    public string? CustomUrl { get; set; }
    public List<string> Assets { get; set; } = new();
}

public enum PostStatus
{
    Draft,
    Published,
    Scheduled
}

public class PostMetadata
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    public PostStatus Status { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<string> Categories { get; set; } = new();
    public string? CustomUrl { get; set; }
}

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = UserRole.Author.ToString();
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime LastLoginDate { get; set; }
    public bool IsActive { get; set; } = true;
}

public enum UserRole
{
    Admin,
    Editor,
    Author
}

public class Category
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PostCount { get; set; }
}

public class Tag
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int PostCount { get; set; }
}

public class MediaFile
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedDate { get; set; } = DateTime.UtcNow;
    public MediaType Type { get; set; }
    public ImageMetadata? ImageMetadata { get; set; }
}

public enum MediaType
{
    Image,
    Document,
    Other
}

public class ImageMetadata
{
    public int Width { get; set; }
    public int Height { get; set; }
    public Dictionary<string, string> ResizedVersions { get; set; } = new();
}

public class SiteConfiguration
{
    public string SiteName { get; set; } = "My Blog";
    public string SiteUrl { get; set; } = "https://myblog.com";
    public string Description { get; set; } = "A personal blog";
    public string Author { get; set; } = "Blog Author";
    public int PostsPerPage { get; set; } = 10;
    public bool EnableComments { get; set; } = false;
    public List<string> ImageSizes { get; set; } = new() { "300", "600", "1200" };
    public string TimeZone { get; set; } = "UTC";
}

// Request/Response DTOs
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserInfo User { get; set; } = new();
}

public class UserInfo
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class CreatePostRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public List<string> Categories { get; set; } = new();
    public string? CustomUrl { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public DateTime? ScheduledDate { get; set; }
}

public class UpdatePostRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Content { get; set; }
    public List<string>? Tags { get; set; }
    public List<string>? Categories { get; set; }
    public string? CustomUrl { get; set; }
    public PostStatus? Status { get; set; }
    public DateTime? ScheduledDate { get; set; }
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = UserRole.Author.ToString();
    public string FirstName { get; set; }
    public string LastName { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class ServiceResult<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string? ErrorMessage { get; set; }

    public static ServiceResult<T> Success(T data) => new() { IsSuccess = true, Data = data };
    public static ServiceResult<T> Failure(string error) => new() { IsSuccess = false, ErrorMessage = error };
}