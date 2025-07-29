using System.Text.Json;
using System.Text.RegularExpressions;
using SkFileBlogSystem.Models;
using SkFileBlogSystem.Services;

namespace SkFileBlogSystem.Services;

public class PostService : IPostService
{
    private readonly string _contentPath;
    private readonly IUserService _userService;
    private readonly ICategoryService _categoryService;
    private readonly ITagService _tagService;
    private readonly ILogger<PostService>? _logger;

    public PostService(IConfiguration configuration, IUserService userService, 
        ICategoryService categoryService, ITagService tagService, ILogger<PostService>? logger = null)
    {
        _contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _userService = userService;
        _categoryService = categoryService;
        _tagService = tagService;
        _logger = logger;
        
        _logger?.LogInformation($"PostService initialized with ContentPath: {_contentPath}");
        EnsureDirectoryStructure();
    }

    private void EnsureDirectoryStructure()
    {
        try
        {
            var postsDir = Path.Combine(_contentPath, "posts");
            var usersDir = Path.Combine(_contentPath, "users");
            var categoriesDir = Path.Combine(_contentPath, "categories");
            var tagsDir = Path.Combine(_contentPath, "tags");

            Directory.CreateDirectory(postsDir);
            Directory.CreateDirectory(usersDir);
            Directory.CreateDirectory(categoriesDir);
            Directory.CreateDirectory(tagsDir);

            _logger?.LogInformation("Directory structure ensured successfully");
            _logger?.LogInformation($"Posts directory: {postsDir} (exists: {Directory.Exists(postsDir)})");
            _logger?.LogInformation($"Users directory: {usersDir} (exists: {Directory.Exists(usersDir)})");
            _logger?.LogInformation($"Categories directory: {categoriesDir} (exists: {Directory.Exists(categoriesDir)})");
            _logger?.LogInformation($"Tags directory: {tagsDir} (exists: {Directory.Exists(tagsDir)})");
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to ensure directory structure");
            throw;
        }
    }

    public async Task<PagedResult<Post>> GetPostsAsync(int page, int pageSize)
    {
        try
        {
            var postsDir = Path.Combine(_contentPath, "posts");
            var allPosts = new List<Post>();

            _logger?.LogInformation($"Attempting to read posts from: {postsDir}");

            if (!Directory.Exists(postsDir))
            {
                _logger?.LogWarning($"Posts directory does not exist: {postsDir}");
                return new PagedResult<Post>
                {
                    Items = new List<Post>(),
                    TotalCount = 0,
                    Page = page,
                    PageSize = pageSize
                };
            }

            var postDirectories = Directory.GetDirectories(postsDir);
            _logger?.LogInformation($"Found {postDirectories.Length} post directories");

            // First pass: Update scheduled posts that should be published
            foreach (var postDir in postDirectories)
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
        foreach (var postDir in postDirectories)
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

        _logger?.LogInformation($"Returning {pagedPosts.Count} posts out of {totalCount} total");

        return new PagedResult<Post>
        {
            Items = pagedPosts,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error in GetPostsAsync");
            return new PagedResult<Post>
            {
                Items = new List<Post>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize
            };
        }
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
                AuthorName = !string.IsNullOrEmpty(user.DisplayName) ? user.DisplayName : user.Username,
                PublishedDate = request.Status == PostStatus.Published ? postDate : DateTime.MinValue,
                ModifiedDate = postDate,
                Status = request.Status,
                ScheduledDate = request.ScheduledDate.HasValue ? request.ScheduledDate.Value.AddHours(-3) : request.ScheduledDate,
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