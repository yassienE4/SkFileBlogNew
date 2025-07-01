using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SkFileBlogSystem.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Markdig;

namespace SkFileBlogSystem.Services;

public interface IPostService
{
    Task<PagedResult<Post>> GetPostsAsync(int page, int pageSize);
    Task<Post?> GetPostBySlugAsync(string slug);
    Task<ServiceResult<Post>> CreatePostAsync(CreatePostRequest request, string authorId);
    Task<ServiceResult<Post>> UpdatePostAsync(string slug, UpdatePostRequest request);
    Task<ServiceResult<bool>> DeletePostAsync(string slug);
    Task PublishScheduledPostsAsync();
}

public class PostService : IPostService
{
    private readonly string _contentPath;
    private readonly IUserService _userService;
    private readonly ICategoryService _categoryService;
    private readonly ITagService _tagService;

    public PostService(IConfiguration configuration, IUserService userService, 
        ICategoryService categoryService, ITagService tagService)
    {
        _contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _userService = userService;
        _categoryService = categoryService;
        _tagService = tagService;
        EnsureDirectoryStructure();
    }

    private void EnsureDirectoryStructure()
    {
        Directory.CreateDirectory(Path.Combine(_contentPath, "posts"));
        Directory.CreateDirectory(Path.Combine(_contentPath, "users"));
        Directory.CreateDirectory(Path.Combine(_contentPath, "categories"));
        Directory.CreateDirectory(Path.Combine(_contentPath, "tags"));
    }

    public async Task<PagedResult<Post>> GetPostsAsync(int page, int pageSize)
    {
        var postsDir = Path.Combine(_contentPath, "posts");
        var allPosts = new List<Post>();

        // First pass: Update scheduled posts that should be published
        foreach (var postDir in Directory.GetDirectories(postsDir))
        {
            var metaPath = Path.Combine(postDir, "meta.json");
            if (File.Exists(metaPath))
            {
                var metadata = JsonSerializer.Deserialize<PostMetadata>(await File.ReadAllTextAsync(metaPath));
                if (metadata?.Status == PostStatus.Scheduled && 
                    metadata.ScheduledDate.HasValue && 
                    metadata.ScheduledDate.Value <= DateTime.UtcNow)
                {
                    metadata.Status = PostStatus.Published;
                    metadata.PublishedDate = DateTime.UtcNow;
                    
                    await File.WriteAllTextAsync(metaPath, 
                        JsonSerializer.Serialize(metadata, new JsonSerializerOptions { WriteIndented = true }));
                }
            }
        }

        // Second pass: Load published posts
        foreach (var postDir in Directory.GetDirectories(postsDir))
        {
            var metaPath = Path.Combine(postDir, "meta.json");
            if (File.Exists(metaPath))
            {
                var metadata = JsonSerializer.Deserialize<PostMetadata>(await File.ReadAllTextAsync(metaPath));
                if (metadata?.Status == PostStatus.Published && metadata.PublishedDate <= DateTime.UtcNow)
                {
                    var post = await LoadFullPost(postDir, metadata);
                    if (post != null)
                        allPosts.Add(post);
                }
            }
        }

        var sortedPosts = allPosts.OrderByDescending(p => p.PublishedDate).ToList();
        var totalCount = sortedPosts.Count;
        var pagedPosts = sortedPosts.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PagedResult<Post>
        {
            Items = pagedPosts,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<Post?> GetPostBySlugAsync(string slug)
    {
        var postsDir = Path.Combine(_contentPath, "posts");
        
        foreach (var postDir in Directory.GetDirectories(postsDir))
        {
            var metaPath = Path.Combine(postDir, "meta.json");
            if (File.Exists(metaPath))
            {
                var metadata = JsonSerializer.Deserialize<PostMetadata>(await File.ReadAllTextAsync(metaPath));
                if (metadata?.Slug == slug || metadata?.CustomUrl == slug)
                {
                    return await LoadFullPost(postDir, metadata);
                }
            }
        }

        return null;
    }

    public async Task<ServiceResult<Post>> CreatePostAsync(CreatePostRequest request, string authorId)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Title))
                return ServiceResult<Post>.Failure("Title is required");

            var user = await _userService.GetUserByIdAsync(authorId);
            if (user == null)
                return ServiceResult<Post>.Failure("Invalid author");

            var slug = GenerateSlug(request.Title);
            var postDate = DateTime.UtcNow;
            var postDirName = $"{postDate:yyyy-MM-dd}-{slug}";
            var postPath = Path.Combine(_contentPath, "posts", postDirName);

            // Check if post already exists
            if (Directory.Exists(postPath))
                return ServiceResult<Post>.Failure("A post with this title already exists");

            Directory.CreateDirectory(postPath);
            Directory.CreateDirectory(Path.Combine(postPath, "assets"));

            var post = new Post
            {
                Id = Guid.NewGuid().ToString(),
                Title = request.Title,
                Slug = slug,
                Description = request.Description,
                Content = request.Content,
                AuthorId = authorId,
                AuthorName = user.DisplayName,
                PublishedDate = request.Status == PostStatus.Published ? postDate : DateTime.MinValue,
                ModifiedDate = postDate,
                Status = request.Status,
                ScheduledDate = request.ScheduledDate,
                Tags = request.Tags ?? new List<string>(),
                Categories = request.Categories ?? new List<string>(),
                CustomUrl = request.CustomUrl
            };

            // Save metadata
            var metadata = MapToMetadata(post);
            await File.WriteAllTextAsync(Path.Combine(postPath, "meta.json"), 
                JsonSerializer.Serialize(metadata, new JsonSerializerOptions { WriteIndented = true }));

            // Save content
            await File.WriteAllTextAsync(Path.Combine(postPath, "content.md"), request.Content ?? "");

            // Update categories and tags
            foreach (var category in post.Categories)
            {
                await _categoryService.IncrementPostCountAsync(category);
            }

            foreach (var tag in post.Tags)
            {
                await _tagService.IncrementPostCountAsync(tag);
            }

            return ServiceResult<Post>.Success(post);
        }
        catch (Exception ex)
        {
            return ServiceResult<Post>.Failure($"Failed to create post: {ex.Message}");
        }
    }

    public async Task<ServiceResult<Post>> UpdatePostAsync(string slug, UpdatePostRequest request)
    {
        try
        {
            var existingPost = await GetPostBySlugAsync(slug);
            if (existingPost == null)
                return ServiceResult<Post>.Failure("Post not found");

            var postDir = await FindPostDirectory(slug);
            if (string.IsNullOrEmpty(postDir))
                return ServiceResult<Post>.Failure("Post directory not found");

            // Update fields
            if (!string.IsNullOrWhiteSpace(request.Title))
                existingPost.Title = request.Title;
            
            if (request.Description != null)
                existingPost.Description = request.Description;
            
            if (request.Content != null)
            {
                existingPost.Content = request.Content;
                await File.WriteAllTextAsync(Path.Combine(postDir, "content.md"), request.Content);
            }

            if (request.Tags != null)
            {
                // Update tag counts
                foreach (var oldTag in existingPost.Tags.Except(request.Tags))
                {
                    await _tagService.DecrementPostCountAsync(oldTag);
                }
                foreach (var newTag in request.Tags.Except(existingPost.Tags))
                {
                    await _tagService.IncrementPostCountAsync(newTag);
                }
                existingPost.Tags = request.Tags;
            }

            if (request.Categories != null)
            {
                // Update category counts
                foreach (var oldCat in existingPost.Categories.Except(request.Categories))
                {
                    await _categoryService.DecrementPostCountAsync(oldCat);
                }
                foreach (var newCat in request.Categories.Except(existingPost.Categories))
                {
                    await _categoryService.IncrementPostCountAsync(newCat);
                }
                existingPost.Categories = request.Categories;
            }

            if (request.Status.HasValue)
            {
                existingPost.Status = request.Status.Value;
                if (request.Status.Value == PostStatus.Published && existingPost.PublishedDate == DateTime.MinValue)
                {
                    existingPost.PublishedDate = DateTime.UtcNow;
                }
            }

            if (request.ScheduledDate.HasValue)
                existingPost.ScheduledDate = request.ScheduledDate;

            if (!string.IsNullOrWhiteSpace(request.CustomUrl))
                existingPost.CustomUrl = request.CustomUrl;

            existingPost.ModifiedDate = DateTime.UtcNow;

            // Save updated metadata
            var metadata = MapToMetadata(existingPost);
            await File.WriteAllTextAsync(Path.Combine(postDir, "meta.json"), 
                JsonSerializer.Serialize(metadata, new JsonSerializerOptions { WriteIndented = true }));

            return ServiceResult<Post>.Success(existingPost);
        }
        catch (Exception ex)
        {
            return ServiceResult<Post>.Failure($"Failed to update post: {ex.Message}");
        }
    }

    public async Task<ServiceResult<bool>> DeletePostAsync(string slug)
    {
        try
        {
            var post = await GetPostBySlugAsync(slug);
            if (post == null)
                return ServiceResult<bool>.Failure("Post not found");

            var postDir = await FindPostDirectory(slug);
            if (string.IsNullOrEmpty(postDir))
                return ServiceResult<bool>.Failure("Post directory not found");

            // Update category and tag counts
            foreach (var category in post.Categories)
            {
                await _categoryService.DecrementPostCountAsync(category);
            }

            foreach (var tag in post.Tags)
            {
                await _tagService.DecrementPostCountAsync(tag);
            }

            // Delete directory
            Directory.Delete(postDir, true);

            return ServiceResult<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return ServiceResult<bool>.Failure($"Failed to delete post: {ex.Message}");
        }
    }

    public async Task PublishScheduledPostsAsync()
    {
        var postsDir = Path.Combine(_contentPath, "posts");
        
        foreach (var postDir in Directory.GetDirectories(postsDir))
        {
            var metaPath = Path.Combine(postDir, "meta.json");
            if (File.Exists(metaPath))
            {
                var metadata = JsonSerializer.Deserialize<PostMetadata>(await File.ReadAllTextAsync(metaPath));
                if (metadata?.Status == PostStatus.Scheduled && 
                    metadata.ScheduledDate.HasValue && 
                    metadata.ScheduledDate.Value <= DateTime.UtcNow)
                {
                    metadata.Status = PostStatus.Published;
                    metadata.PublishedDate = DateTime.UtcNow;
                    
                    await File.WriteAllTextAsync(metaPath, 
                        JsonSerializer.Serialize(metadata, new JsonSerializerOptions { WriteIndented = true }));
                }
            }
        }
    }

    private async Task<Post?> LoadFullPost(string postDir, PostMetadata metadata)
    {
        var contentPath = Path.Combine(postDir, "content.md");
        if (!File.Exists(contentPath))
            return null;

        var content = await File.ReadAllTextAsync(contentPath);
        
        return new Post
        {
            Id = metadata.Id,
            Title = metadata.Title,
            Slug = metadata.Slug,
            Description = metadata.Description,
            Content = content,
            AuthorId = metadata.AuthorId,
            AuthorName = metadata.AuthorName,
            PublishedDate = metadata.PublishedDate,
            ModifiedDate = metadata.ModifiedDate,
            Status = metadata.Status,
            ScheduledDate = metadata.ScheduledDate,
            Tags = metadata.Tags ?? new List<string>(),
            Categories = metadata.Categories ?? new List<string>(),
            CustomUrl = metadata.CustomUrl,
            Assets = GetPostAssets(postDir)
        };
    }

    private List<string> GetPostAssets(string postDir)
    {
        var assetsDir = Path.Combine(postDir, "assets");
        if (!Directory.Exists(assetsDir))
            return new List<string>();

        return Directory.GetFiles(assetsDir)
            .Select(f => Path.GetFileName(f))
            .ToList();
    }

    private async Task<string> FindPostDirectory(string slug)
    {
        var postsDir = Path.Combine(_contentPath, "posts");
        
        foreach (var postDir in Directory.GetDirectories(postsDir))
        {
            var metaPath = Path.Combine(postDir, "meta.json");
            if (File.Exists(metaPath))
            {
                var metadata = JsonSerializer.Deserialize<PostMetadata>(await File.ReadAllTextAsync(metaPath));
                if (metadata?.Slug == slug || metadata?.CustomUrl == slug)
                {
                    return postDir;
                }
            }
        }

        return string.Empty;
    }

    private PostMetadata MapToMetadata(Post post)
    {
        return new PostMetadata
        {
            Id = post.Id,
            Title = post.Title,
            Slug = post.Slug,
            Description = post.Description,
            AuthorId = post.AuthorId,
            AuthorName = post.AuthorName,
            PublishedDate = post.PublishedDate,
            ModifiedDate = post.ModifiedDate,
            Status = post.Status,
            ScheduledDate = post.ScheduledDate,
            Tags = post.Tags,
            Categories = post.Categories,
            CustomUrl = post.CustomUrl
        };
    }

    private string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        return slug.Trim('-');
    }
}

public interface IUserService
{
    Task<User?> GetUserByEmailAsync(string email); // Add this line
    Task<List<User>> GetAllUsersAsync();
    Task<User?> GetUserByIdAsync(string id);
    Task<User?> GetUserByUsernameAsync(string username);
    Task<ServiceResult<User>> CreateUserAsync(CreateUserRequest request);
    Task<bool> ValidatePasswordAsync(string username, string password);
}

public class UserService : IUserService
{
    private readonly string _usersPath;
    private const string PasswordSalt = "SkFileBlog2024SecureSalt!"; // Should be in config
    private readonly List<User> _users;
    private readonly ILogger<UserService> _logger;
    public async Task<User?> GetUserByEmailAsync(string email)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            // Normalize email to lowercase for comparison
            var normalizedEmail = email.ToLowerInvariant();
            
            return await Task.FromResult(_users.FirstOrDefault(u => 
                u.Email.ToLowerInvariant() == normalizedEmail));
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error getting user by email: {Email}", email);
            return null;
        }
    }
    public UserService(IConfiguration configuration)
    {
        var contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _usersPath = Path.Combine(contentPath, "users");
        Directory.CreateDirectory(_usersPath);
    }

    public async Task<List<User>> GetAllUsersAsync()
    {
        var users = new List<User>();

        foreach (var userDir in Directory.GetDirectories(_usersPath))
        {
            var profilePath = Path.Combine(userDir, "profile.json");
            if (File.Exists(profilePath))
            {
                var user = JsonSerializer.Deserialize<User>(await File.ReadAllTextAsync(profilePath));
                if (user != null)
                {
                    user.PasswordHash = string.Empty; // Don't expose password hash
                    users.Add(user);
                }
            }
        }

        return users;
    }

    public async Task<User?> GetUserByIdAsync(string id)
    {
        foreach (var userDir in Directory.GetDirectories(_usersPath))
        {
            var profilePath = Path.Combine(userDir, "profile.json");
            if (File.Exists(profilePath))
            {
                var user = JsonSerializer.Deserialize<User>(await File.ReadAllTextAsync(profilePath));
                if (user?.Id == id)
                {
                    user.PasswordHash = string.Empty;
                    return user;
                }
            }
        }

        return null;
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        var userDir = Path.Combine(_usersPath, username.ToLowerInvariant());
        var profilePath = Path.Combine(userDir, "profile.json");
        
        if (File.Exists(profilePath))
        {
            var user = JsonSerializer.Deserialize<User>(await File.ReadAllTextAsync(profilePath));
            return user;
        }

        return null;
    }

    public async Task<ServiceResult<User>> CreateUserAsync(CreateUserRequest request)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Username) || !Regex.IsMatch(request.Username, @"^[a-zA-Z0-9_-]+$"))
                return ServiceResult<User>.Failure("Username must contain only letters, numbers, hyphens, and underscores");

            if (string.IsNullOrWhiteSpace(request.Email) || !Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return ServiceResult<User>.Failure("Invalid email format");

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                return ServiceResult<User>.Failure("Password must be at least 8 characters long");

            // Check if user already exists
            var existingUser = await GetUserByUsernameAsync(request.Username);
            if (existingUser != null)
                return ServiceResult<User>.Failure("Username already exists");

            var userDir = Path.Combine(_usersPath, request.Username.ToLowerInvariant());
            Directory.CreateDirectory(userDir);

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Username = request.Username,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                DisplayName = request.DisplayName ?? request.Username,
                Role = request.Role,
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            };

            await File.WriteAllTextAsync(Path.Combine(userDir, "profile.json"), 
                JsonSerializer.Serialize(user, new JsonSerializerOptions { WriteIndented = true }));

            user.PasswordHash = string.Empty; // Don't return password hash
            return ServiceResult<User>.Success(user);
        }
        catch (Exception ex)
        {
            return ServiceResult<User>.Failure($"Failed to create user: {ex.Message}");
        }
    }

    public async Task<bool> ValidatePasswordAsync(string username, string password)
    {
        var user = await GetUserByUsernameAsync(username);
        if (user == null || !user.IsActive)
            return false;

        return VerifyPassword(password, user.PasswordHash);
    }

    private string HashPassword(string password)
    {
        // Using PBKDF2 for better security
        using var rfc2898 = new Rfc2898DeriveBytes(password, Encoding.UTF8.GetBytes(PasswordSalt), 10000, HashAlgorithmName.SHA256);
        return Convert.ToBase64String(rfc2898.GetBytes(32));
    }

    private bool VerifyPassword(string password, string hash)
    {
        var passwordHash = HashPassword(password);
        return passwordHash == hash;
    }
}

public interface ICategoryService
{
    Task<List<Category>> GetAllCategoriesAsync();
    Task<Category?> GetCategoryBySlugAsync(string slug);
    Task<PagedResult<Post>?> GetPostsByCategoryAsync(string slug, int page, int pageSize);
    Task IncrementPostCountAsync(string categoryName);
    Task DecrementPostCountAsync(string categoryName);
}

public class CategoryService : ICategoryService
{
    private readonly string _categoriesPath;
    private IPostService? _postService;

    public CategoryService(IConfiguration configuration)
    {
        var contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _categoriesPath = Path.Combine(contentPath, "categories");
        Directory.CreateDirectory(_categoriesPath);
    }

    public void SetPostService(IPostService postService)
    {
        _postService = postService;
    }

    public async Task<List<Category>> GetAllCategoriesAsync()
    {
        var categories = new List<Category>();

        foreach (var file in Directory.GetFiles(_categoriesPath, "*.json"))
        {
            var category = JsonSerializer.Deserialize<Category>(await File.ReadAllTextAsync(file));
            if (category != null)
                categories.Add(category);
        }

        return categories.OrderBy(c => c.Name).ToList();
    }

    public async Task<Category?> GetCategoryBySlugAsync(string slug)
    {
        var filePath = Path.Combine(_categoriesPath, $"{slug}.json");
        if (File.Exists(filePath))
        {
            return JsonSerializer.Deserialize<Category>(await File.ReadAllTextAsync(filePath));
        }
        return null;
    }

    public async Task<PagedResult<Post>?> GetPostsByCategoryAsync(string slug, int page, int pageSize)
    {
        var category = await GetCategoryBySlugAsync(slug);
        if (category == null || _postService == null)
            return null;

        // This is a simplified implementation. In a real scenario, you might want to optimize this
        var allPosts = await _postService.GetPostsAsync(1, int.MaxValue);
        var categoryPosts = allPosts.Items.Where(p => p.Categories.Contains(category.Name)).ToList();

        var totalCount = categoryPosts.Count;
        var pagedPosts = categoryPosts.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PagedResult<Post>
        {
            Items = pagedPosts,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task IncrementPostCountAsync(string categoryName)
    {
        var slug = GenerateSlug(categoryName);
        var filePath = Path.Combine(_categoriesPath, $"{slug}.json");
        
        Category category;
        if (File.Exists(filePath))
        {
            category = JsonSerializer.Deserialize<Category>(await File.ReadAllTextAsync(filePath))!;
            category.PostCount++;
        }
        else
        {
            category = new Category
            {
                Name = categoryName,
                Slug = slug,
                PostCount = 1
            };
        }

        await File.WriteAllTextAsync(filePath, 
            JsonSerializer.Serialize(category, new JsonSerializerOptions { WriteIndented = true }));
    }

    public async Task DecrementPostCountAsync(string categoryName)
    {
        var slug = GenerateSlug(categoryName);
        var filePath = Path.Combine(_categoriesPath, $"{slug}.json");
        
        if (File.Exists(filePath))
        {
            var category = JsonSerializer.Deserialize<Category>(await File.ReadAllTextAsync(filePath))!;
            category.PostCount = Math.Max(0, category.PostCount - 1);
            
            if (category.PostCount == 0)
            {
                File.Delete(filePath);
            }
            else
            {
                await File.WriteAllTextAsync(filePath, 
                    JsonSerializer.Serialize(category, new JsonSerializerOptions { WriteIndented = true }));
            }
        }
    }

    private string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        return slug.Trim('-');
    }
}

public interface ITagService
{
    Task<List<Tag>> GetAllTagsAsync();
    Task<PagedResult<Post>?> GetPostsByTagAsync(string slug, int page, int pageSize);
    Task IncrementPostCountAsync(string tagName);
    Task DecrementPostCountAsync(string tagName);
}

public class TagService : ITagService
{
    private readonly string _tagsPath;
    private IPostService? _postService;

    public TagService(IConfiguration configuration)
    {
        var contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _tagsPath = Path.Combine(contentPath, "tags");
        Directory.CreateDirectory(_tagsPath);
    }

    public void SetPostService(IPostService postService)
    {
        _postService = postService;
    }

    public async Task<List<Tag>> GetAllTagsAsync()
    {
        var tags = new List<Tag>();

        foreach (var file in Directory.GetFiles(_tagsPath, "*.json"))
        {
            var tag = JsonSerializer.Deserialize<Tag>(await File.ReadAllTextAsync(file));
            if (tag != null)
                tags.Add(tag);
        }

        return tags.OrderBy(t => t.Name).ToList();
    }

    public async Task<PagedResult<Post>?> GetPostsByTagAsync(string slug, int page, int pageSize)
    {
        var filePath = Path.Combine(_tagsPath, $"{slug}.json");
        if (!File.Exists(filePath))
            return null;

        var tag = JsonSerializer.Deserialize<Tag>(await File.ReadAllTextAsync(filePath));
        if (tag == null || _postService == null)
            return null;

        // This is a simplified implementation
        var allPosts = await _postService.GetPostsAsync(1, int.MaxValue);
        var tagPosts = allPosts.Items.Where(p => p.Tags.Contains(tag.Name)).ToList();

        var totalCount = tagPosts.Count;
        var pagedPosts = tagPosts.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PagedResult<Post>
        {
            Items = pagedPosts,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task IncrementPostCountAsync(string tagName)
    {
        var slug = GenerateSlug(tagName);
        var filePath = Path.Combine(_tagsPath, $"{slug}.json");
        
        Tag tag;
        if (File.Exists(filePath))
        {
            tag = JsonSerializer.Deserialize<Tag>(await File.ReadAllTextAsync(filePath))!;
            tag.PostCount++;
        }
        else
        {
            tag = new Tag
            {
                Name = tagName,
                Slug = slug,
                PostCount = 1
            };
        }

        await File.WriteAllTextAsync(filePath, 
            JsonSerializer.Serialize(tag, new JsonSerializerOptions { WriteIndented = true }));
    }

    public async Task DecrementPostCountAsync(string tagName)
    {
        var slug = GenerateSlug(tagName);
        var filePath = Path.Combine(_tagsPath, $"{slug}.json");
        
        if (File.Exists(filePath))
        {
            var tag = JsonSerializer.Deserialize<Tag>(await File.ReadAllTextAsync(filePath))!;
            tag.PostCount = Math.Max(0, tag.PostCount - 1);
            
            if (tag.PostCount == 0)
            {
                File.Delete(filePath);
            }
            else
            {
                await File.WriteAllTextAsync(filePath, 
                    JsonSerializer.Serialize(tag, new JsonSerializerOptions { WriteIndented = true }));
            }
        }
    }

    private string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        return slug.Trim('-');
    }
}