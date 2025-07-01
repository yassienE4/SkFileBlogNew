using System.Text;
using System.Xml.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using SkFileBlogSystem.Services;
using Microsoft.IdentityModel.Tokens;
using SkFileBlogSystem.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Markdig;

namespace SkFileBlogSystem.Services;

public interface IAuthService
{
    Task<ServiceResult<AuthResponse>> LoginAsync(string username, string password);
    Task<ServiceResult<AuthResponse>> RefreshTokenAsync(string refreshToken);
    Task<ServiceResult<User>> RegisterAsync(string username, string email, string password, string firstName, string lastName);
}

public class AuthService : IAuthService
{
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    public async Task<ServiceResult<User>> RegisterAsync(string username, string email, string password, string firstName, string lastName)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                return ServiceResult<User>.Failure("Username, email, and password are required.");
            }

            if (password.Length < 6)
            {
                return ServiceResult<User>.Failure("Password must be at least 6 characters long.");
            }

            // Check if user already exists
            var existingUser = await _userService.GetUserByUsernameAsync(username);
            if (existingUser != null)
            {
                return ServiceResult<User>.Failure("Username already exists.");
            }

            var existingEmail = await _userService.GetUserByEmailAsync(email);
            if (existingEmail != null)
            {
                return ServiceResult<User>.Failure("Email already exists.");
            }

            // Create user request
            var createUserRequest = new CreateUserRequest
            {
                Username = username,
                Email = email,
                Password = password,
                FirstName = firstName,
                LastName = lastName,
                Role = "User" // Default role for registration
            };

            // Create the user
            var result = await _userService.CreateUserAsync(createUserRequest);
        
            return result.IsSuccess 
                ? ServiceResult<User>.Success(result.Data) 
                : ServiceResult<User>.Failure(result.ErrorMessage);
        }
        catch (Exception ex)
        {
            return ServiceResult<User>.Failure($"Registration failed: {ex.Message}");
        }
    }
    public AuthService(IUserService userService, IConfiguration configuration)
    {
        _userService = userService;
        _configuration = configuration;
        _secretKey = configuration["JwtSettings:SecretKey"] ?? "your-super-secret-key-change-this-in-production";
        _issuer = configuration["JwtSettings:Issuer"] ?? "blog-system";
        _audience = configuration["JwtSettings:Audience"] ?? "blog-system-users";
    }

    public async Task<ServiceResult<AuthResponse>> LoginAsync(string username, string password)
    {
        try
        {
            if (!await _userService.ValidatePasswordAsync(username, password))
                return ServiceResult<AuthResponse>.Failure("Invalid username or password");

            var user = await _userService.GetUserByUsernameAsync(username);
            if (user == null || !user.IsActive)
                return ServiceResult<AuthResponse>.Failure("User not found or inactive");

            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();

            // Update last login date
            user.LastLoginDate = DateTime.UtcNow;
            // In a real app, you'd save this update

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = new UserInfo
                {
                    Id = user.Id,
                    Username = user.Username,
                    DisplayName = user.DisplayName,
                    Role = user.Role.ToString()
                }
            };

            return ServiceResult<AuthResponse>.Success(response);
        }
        catch (Exception ex)
        {
            return ServiceResult<AuthResponse>.Failure($"Login failed: {ex.Message}");
        }
    }

    public async Task<ServiceResult<AuthResponse>> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            // In a real implementation, you'd validate the refresh token from storage
            // For now, we'll just generate new tokens
            
            // This is a simplified implementation
            var response = new AuthResponse
            {
                AccessToken = GenerateAccessToken(new User { Id = "temp", Username = "temp", Role = UserRole.Author.ToString() }),
                RefreshToken = GenerateRefreshToken(),
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            return ServiceResult<AuthResponse>.Success(response);
        }
        catch (Exception ex)
        {
            return ServiceResult<AuthResponse>.Failure($"Token refresh failed: {ex.Message}");
        }
    }

    private string GenerateAccessToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secretKey);
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("DisplayName", user.DisplayName)
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}

public interface IMediaService
{
    Task<ServiceResult<MediaFile>> UploadFileAsync(IFormFile file, string userId);
    Task<ServiceResult<bool>> DeleteFileAsync(string fileId);
}

public class MediaService : IMediaService
{
    private readonly string _mediaPath;
    private readonly IConfiguration _configuration;
    private readonly List<int> _imageSizes;

    public MediaService(IConfiguration configuration)
    {
        _configuration = configuration;
        var contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _mediaPath = Path.Combine(contentPath, "media");
        Directory.CreateDirectory(_mediaPath);
        
        _imageSizes = configuration.GetSection("ImageSizes").Get<List<int>>() ?? new List<int> { 300, 600, 1200 };
    }

    public async Task<ServiceResult<MediaFile>> UploadFileAsync(IFormFile file, string userId)
    {
        try
        {
            if (file == null || file.Length == 0)
                return ServiceResult<MediaFile>.Failure("No file provided");

            // Validate file size (10MB max)
            if (file.Length > 10 * 1024 * 1024)
                return ServiceResult<MediaFile>.Failure("File size exceeds 10MB limit");

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx" };
            
            if (!allowedExtensions.Contains(fileExtension))
                return ServiceResult<MediaFile>.Failure("File type not allowed");

            var mediaFile = new MediaFile
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                UploadedBy = userId,
                UploadedDate = DateTime.UtcNow
            };

            // Determine media type
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            mediaFile.Type = imageExtensions.Contains(fileExtension) ? MediaType.Image : MediaType.Document;

            // Create directory structure
            var yearMonth = DateTime.UtcNow.ToString("yyyy-MM");
            var uploadDir = Path.Combine(_mediaPath, yearMonth);
            Directory.CreateDirectory(uploadDir);

            // Generate unique filename
            var uniqueFileName = $"{mediaFile.Id}{fileExtension}";
            var filePath = Path.Combine(uploadDir, uniqueFileName);
            mediaFile.FilePath = Path.Combine(yearMonth, uniqueFileName);

            // Save original file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Process images
            if (mediaFile.Type == MediaType.Image)
            {
                var imageMetadata = await ProcessImageAsync(filePath, uploadDir, mediaFile.Id);
                mediaFile.ImageMetadata = imageMetadata;
            }

            return ServiceResult<MediaFile>.Success(mediaFile);
        }
        catch (Exception ex)
        {
            return ServiceResult<MediaFile>.Failure($"Upload failed: {ex.Message}");
        }
    }

    public async Task<ServiceResult<bool>> DeleteFileAsync(string fileId)
    {
        try
        {
            // Find and delete file
            // This is a simplified implementation
            return ServiceResult<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return ServiceResult<bool>.Failure($"Delete failed: {ex.Message}");
        }
    }

    private async Task<ImageMetadata> ProcessImageAsync(string originalPath, string uploadDir, string fileId)
    {
        using var image = await Image.LoadAsync(originalPath);
        
        var metadata = new ImageMetadata
        {
            Width = image.Width,
            Height = image.Height
        };

        // Create resized versions
        foreach (var targetWidth in _imageSizes)
        {
            if (image.Width > targetWidth)
            {
                var resizedFileName = $"{fileId}-{targetWidth}w.jpg";
                var resizedPath = Path.Combine(uploadDir, resizedFileName);
                
                var height = (int)(image.Height * ((float)targetWidth / image.Width));
                
                using var resizedImage = image.Clone(ctx => ctx.Resize(targetWidth, height));
                await resizedImage.SaveAsJpegAsync(resizedPath, new SixLabors.ImageSharp.Formats.Jpeg.JpegEncoder { Quality = 85 });
                
                metadata.ResizedVersions[$"{targetWidth}w"] = resizedFileName;
            }
        }

        return metadata;
    }
}

public interface IFeedService
{
    Task<string> GenerateRssFeedAsync();
    Task<string> GenerateAtomFeedAsync();
}

public class FeedService : IFeedService
{
    private readonly IPostService _postService;
    private readonly IConfiguration _configuration;
    private readonly SiteConfiguration _siteConfig;

    public FeedService(IPostService postService, IConfiguration configuration)
    {
        _postService = postService;
        _configuration = configuration;
        
        // Load site configuration
        var configPath = Path.Combine(configuration["ContentPath"] ?? "content", "config", "site.json");
        if (File.Exists(configPath))
        {
            var json = File.ReadAllText(configPath);
            _siteConfig = JsonSerializer.Deserialize<SiteConfiguration>(json) ?? new SiteConfiguration();
        }
        else
        {
            _siteConfig = new SiteConfiguration();
        }
    }

    public async Task<string> GenerateRssFeedAsync()
    {
        var posts = await _postService.GetPostsAsync(1, 20);
        var markdown = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();

        var rss = new XElement("rss",
            new XAttribute("version", "2.0"),
            new XElement("channel",
                new XElement("title", _siteConfig.SiteName),
                new XElement("link", _siteConfig.SiteUrl),
                new XElement("description", _siteConfig.Description),
                new XElement("language", "en-US"),
                new XElement("lastBuildDate", DateTime.UtcNow.ToString("R")),
                posts.Items.Select(post => new XElement("item",
                    new XElement("title", post.Title),
                    new XElement("link", $"{_siteConfig.SiteUrl}/posts/{post.Slug}"),
                    new XElement("description", post.Description),
                    new XElement("content:encoded", 
                        new XCData(Markdown.ToHtml(post.Content, markdown))),
                    new XElement("pubDate", post.PublishedDate.ToString("R")),
                    new XElement("guid", $"{_siteConfig.SiteUrl}/posts/{post.Slug}"),
                    post.Categories.Select(cat => new XElement("category", cat))
                ))
            )
        );

        return new XDocument(new XDeclaration("1.0", "utf-8", null), rss).ToString();
    }

    public async Task<string> GenerateAtomFeedAsync()
    {
        var posts = await _postService.GetPostsAsync(1, 20);
        var markdown = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();

        XNamespace atom = "http://www.w3.org/2005/Atom";

        var feed = new XElement(atom + "feed",
            new XElement(atom + "title", _siteConfig.SiteName),
            new XElement(atom + "link", 
                new XAttribute("href", _siteConfig.SiteUrl),
                new XAttribute("rel", "alternate")),
            new XElement(atom + "link",
                new XAttribute("href", $"{_siteConfig.SiteUrl}/feed/atom"),
                new XAttribute("rel", "self")),
            new XElement(atom + "id", _siteConfig.SiteUrl),
            new XElement(atom + "updated", DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")),
            new XElement(atom + "subtitle", _siteConfig.Description),
            posts.Items.Select(post => new XElement(atom + "entry",
                new XElement(atom + "title", post.Title),
                new XElement(atom + "link",
                    new XAttribute("href", $"{_siteConfig.SiteUrl}/posts/{post.Slug}")),
                new XElement(atom + "id", $"{_siteConfig.SiteUrl}/posts/{post.Slug}"),
                new XElement(atom + "updated", post.ModifiedDate.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")),
                new XElement(atom + "published", post.PublishedDate.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")),
                new XElement(atom + "author",
                    new XElement(atom + "name", post.AuthorName)),
                new XElement(atom + "summary", post.Description),
                new XElement(atom + "content",
                    new XAttribute("type", "html"),
                    new XCData(Markdown.ToHtml(post.Content, markdown))),
                post.Categories.Select(cat => new XElement(atom + "category",
                    new XAttribute("term", cat)))
            ))
        );

        return new XDocument(new XDeclaration("1.0", "utf-8", null), feed).ToString();
    }
}

public interface ISearchService
{
    Task<PagedResult<Post>> SearchPostsAsync(string query, int page, int pageSize);
}

public class SearchService : ISearchService
{
    private readonly IPostService _postService;

    public SearchService(IPostService postService)
    {
        _postService = postService;
    }

    public async Task<PagedResult<Post>> SearchPostsAsync(string query, int page, int pageSize)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new PagedResult<Post>();
        }

        // Get all published posts
        var allPosts = await _postService.GetPostsAsync(1, int.MaxValue);
        
        // Convert query to lowercase for case-insensitive search
        var searchTerms = query.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        
        // Search in title, description, content, tags, and categories
        var matchedPosts = allPosts.Items.Where(post =>
        {
            var searchableContent = $"{post.Title} {post.Description} {post.Content} {string.Join(" ", post.Tags)} {string.Join(" ", post.Categories)}".ToLowerInvariant();
            
            // Check if all search terms are found
            return searchTerms.All(term => searchableContent.Contains(term));
        })
        .OrderByDescending(post =>
        {
            // Simple relevance scoring based on title matches
            var titleLower = post.Title.ToLowerInvariant();
            var score = 0;
            
            foreach (var term in searchTerms)
            {
                if (titleLower.Contains(term))
                    score += 10;
                if (post.Description.ToLowerInvariant().Contains(term))
                    score += 5;
                if (post.Tags.Any(t => t.ToLowerInvariant().Contains(term)))
                    score += 3;
                if (post.Categories.Any(c => c.ToLowerInvariant().Contains(term)))
                    score += 3;
            }
            
            return score;
        })
        .ThenByDescending(post => post.PublishedDate)
        .ToList();

        var totalCount = matchedPosts.Count;
        var pagedPosts = matchedPosts.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PagedResult<Post>
        {
            Items = pagedPosts,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}