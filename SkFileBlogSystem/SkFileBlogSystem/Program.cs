using System.Text;
using System.Text.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SkFileBlogSystem.Models;
using SkFileBlogSystem.Services;
using SkFileBlogSystem.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo 
    { 
        Title = "SkFile Blog System API", 
        Version = "v1" 
    });
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",           // local dev frontend
                "https://sk-file-blog-frontend.vercel.app/"       // your actual domain (if deployed)
            )
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});


// Configure JWT authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? 
                jwtSettings["SecretKey"] ?? 
                "your-super-secret-key-change-this-in-production";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? 
                         jwtSettings["Issuer"] ?? 
                         "blog-system",
            ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? 
                           jwtSettings["Audience"] ?? 
                           "blog-system-users",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

// Register services
builder.Services.AddSingleton<IUserService, UserService>();
builder.Services.AddSingleton<CategoryService>();
builder.Services.AddSingleton<ICategoryService>(provider => provider.GetService<CategoryService>()!);
builder.Services.AddSingleton<TagService>();
builder.Services.AddSingleton<ITagService>(provider => provider.GetService<TagService>()!);
builder.Services.AddSingleton<IPostService, PostService>();
builder.Services.AddSingleton<IMediaService, MediaService>();
builder.Services.AddSingleton<IFeedService, FeedService>();
builder.Services.AddSingleton<IAuthService, AuthService>();
builder.Services.AddSingleton<ISearchService, SearchService>();

var app = builder.Build();

// Configure circular dependencies
using (var scope = app.Services.CreateScope())
{
    var categoryService = scope.ServiceProvider.GetRequiredService<CategoryService>();
    var tagService = scope.ServiceProvider.GetRequiredService<TagService>();
    var postService = scope.ServiceProvider.GetRequiredService<IPostService>();
    
    categoryService.SetPostService(postService);
    tagService.SetPostService(postService);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkFile Blog System API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Middleware
app.UseMiddleware<ErrorHandlingMiddleware>();

// Auth endpoints
app.MapPost("/api/auth/login", async (LoginRequest request, IAuthService authService) =>
{
    var result = await authService.LoginAsync(request.Username, request.Password);
    return result.IsSuccess ? Results.Ok(result.Data) : Results.Unauthorized();
})
.WithName("Login");

app.MapPost("/api/auth/register", async (RegisterRequest request, IAuthService authService) =>
    {
        var result = await authService.RegisterAsync(request.Username, request.Email, request.Password, request.FirstName, request.LastName);
        return result.IsSuccess 
            ? Results.Created($"/api/users/{result.Data.Username}", new { 
                message = "User registered successfully", 
                user = result.Data 
            }) 
            : Results.BadRequest(new { error = result.ErrorMessage });
    })
    .WithName("Register");
app.MapPost("/api/auth/refresh", async (RefreshTokenRequest request, IAuthService authService) =>
{
    var result = await authService.RefreshTokenAsync(request.RefreshToken);
    return result.IsSuccess ? Results.Ok(result.Data) : Results.Unauthorized();
})
.WithName("RefreshToken");

// Post endpoints
app.MapGet("/api/posts", async (int page, int pageSize, IPostService postService) =>
{
    page = Math.Max(1, page);
    pageSize = Math.Clamp(pageSize, 1, 100);
    var posts = await postService.GetPostsAsync(page, pageSize);
    return Results.Ok(posts);
})
.WithName("GetPosts");
app.MapGet("/", async () =>
{
    return Results.Content("Welcome to SkFile Blog System API", "text/plain");
}).WithName("Home");
app.MapGet("/api/posts/{slug}", async (string slug, IPostService postService) =>
{
    var post = await postService.GetPostBySlugAsync(slug);
    return post != null ? Results.Ok(post) : Results.NotFound();
})
.WithName("GetPostBySlug");

app.MapPost("/api/posts", async (CreatePostRequest request, IPostService postService, ClaimsPrincipal user) =>
{
    var authorId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(authorId))
        return Results.Unauthorized();

    var result = await postService.CreatePostAsync(request, authorId);
    return result.IsSuccess 
        ? Results.Created($"/api/posts/{result.Data.Slug}", result.Data) 
        : Results.BadRequest(result.ErrorMessage);
})
.RequireAuthorization()
.WithName("CreatePost");

app.MapPut("/api/posts/{slug}", async (string slug, UpdatePostRequest request, IPostService postService, ClaimsPrincipal user) =>
{
    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
    
    var existingPost = await postService.GetPostBySlugAsync(slug);
    if (existingPost == null)
        return Results.NotFound();

    if (existingPost.AuthorId != userId && userRole != "Admin" && userRole != "Editor")
        return Results.Forbid();

    var result = await postService.UpdatePostAsync(slug, request);
    return result.IsSuccess ? Results.Ok(result.Data) : Results.BadRequest(result.ErrorMessage);
})
.RequireAuthorization()
.WithName("UpdatePost");

app.MapDelete("/api/posts/{slug}", async (string slug, IPostService postService, ClaimsPrincipal user) =>
{
    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
    
    var existingPost = await postService.GetPostBySlugAsync(slug);
    if (existingPost == null)
        return Results.NotFound();

    if (existingPost.AuthorId != userId && userRole != "Admin")
        return Results.Forbid();

    var result = await postService.DeletePostAsync(slug);
    return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.ErrorMessage);
})
.RequireAuthorization()
.WithName("DeletePost");

// Category endpoints
app.MapGet("/api/categories", async (ICategoryService categoryService) =>
{
    var categories = await categoryService.GetAllCategoriesAsync();
    return Results.Ok(categories);
})
.WithName("GetCategories");

app.MapGet("/api/categories/{slug}/posts", async (string slug, int page, int pageSize, ICategoryService categoryService) =>
{
    page = Math.Max(1, page);
    pageSize = Math.Clamp(pageSize, 1, 100);
    var posts = await categoryService.GetPostsByCategoryAsync(slug, page, pageSize);
    return posts != null ? Results.Ok(posts) : Results.NotFound();
})
.WithName("GetPostsByCategory");

// Tag endpoints
app.MapGet("/api/tags", async (ITagService tagService) =>
{
    var tags = await tagService.GetAllTagsAsync();
    return Results.Ok(tags);
})
.WithName("GetTags");

app.MapGet("/api/tags/{slug}/posts", async (string slug, int page, int pageSize, ITagService tagService) =>
{
    page = Math.Max(1, page);
    pageSize = Math.Clamp(pageSize, 1, 100);
    var posts = await tagService.GetPostsByTagAsync(slug, page, pageSize);
    return posts != null ? Results.Ok(posts) : Results.NotFound();
})
.WithName("GetPostsByTag");

// Search endpoint
app.MapGet("/api/search", async (string q, int page, int pageSize, ISearchService searchService) =>
{
    if (string.IsNullOrWhiteSpace(q))
        return Results.BadRequest("Search query is required");

    page = Math.Max(1, page);
    pageSize = Math.Clamp(pageSize, 1, 100);
    var results = await searchService.SearchPostsAsync(q, page, pageSize);
    return Results.Ok(results);
})
.WithName("SearchPosts");

// Media endpoints
app.MapPost("/api/media/upload", async (IFormFile file, IMediaService mediaService, ClaimsPrincipal user) =>
{
    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    var result = await mediaService.UploadFileAsync(file, userId);
    return result.IsSuccess ? Results.Ok(result.Data) : Results.BadRequest(result.ErrorMessage);
})
.RequireAuthorization()
.DisableAntiforgery()
.WithName("UploadMedia");

app.MapGet("/api/media/{fileId}", async (string fileId, IMediaService mediaService) =>
{
    var mediaFile = await mediaService.GetFileAsync(fileId);
    return mediaFile != null ? Results.Ok(mediaFile) : Results.NotFound();
})
.WithName("GetMediaInfo");

app.MapGet("/api/media", async (IMediaService mediaService, ClaimsPrincipal user) =>
{
    var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
    if (userRole == "Admin" || userRole == "Editor")
    {
        var allFiles = await mediaService.GetAllFilesAsync();
        return Results.Ok(allFiles);
    }
    
    if (!string.IsNullOrEmpty(userId))
    {
        var userFiles = await mediaService.GetFilesByUserAsync(userId);
        return Results.Ok(userFiles);
    }
    
    return Results.Unauthorized();
})
.RequireAuthorization()
.WithName("GetAllMedia");

app.MapGet("/media/{*filePath}", async (string filePath, IMediaService mediaService) =>
{
    var file = await mediaService.GetFileStreamAsync(filePath);
    if (file == null)
        return Results.NotFound();

    // return Results.Stream(file.Value.Stream, file.Value.ContentType, file.Value.FileName);
    return Results.Stream(file.Value.Stream, file.Value.ContentType);

})
.WithName("ServeMedia");

app.MapDelete("/api/media/{fileId}", async (string fileId, IMediaService mediaService, ClaimsPrincipal user) =>
{
    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
    
    var mediaFile = await mediaService.GetFileAsync(fileId);
    if (mediaFile == null)
        return Results.NotFound();

    // Only admin or the file owner can delete
    if (userRole != "Admin" && mediaFile.UploadedBy != userId)
        return Results.Forbid();

    var result = await mediaService.DeleteFileAsync(fileId);
    return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.ErrorMessage);
})
.RequireAuthorization()
.WithName("DeleteMedia");

// Feed endpoints
app.MapGet("/feed/rss", async (IFeedService feedService) =>
    {
        var feed = await feedService.GenerateRssFeedAsync();
        return Results.Content(feed, "application/rss+xml");
    })
    .WithName("GetRssFeed");

app.MapGet("/feed/atom", async (IFeedService feedService) =>
    {
        var feed = await feedService.GenerateAtomFeedAsync();
        return Results.Content(feed, "application/atom+xml");
    })
    .WithName("GetAtomFeed");


// User management endpoints (Admin only)
app.MapGet("/api/users", async (IUserService userService) =>
{
    var users = await userService.GetAllUsersAsync();
    return Results.Ok(users);
})
.RequireAuthorization(policy => policy.RequireRole("Admin"))
.WithName("GetUsers");

app.MapPost("/api/users", async (CreateUserRequest request, IUserService userService) =>
{
    var result = await userService.CreateUserAsync(request);
    return result.IsSuccess ? Results.Created($"/api/users/{result.Data.Username}", result.Data) : Results.BadRequest(result.ErrorMessage);
})
.RequireAuthorization(policy => policy.RequireRole("Admin"))
.WithName("CreateUser");

// Health check endpoint
app.MapGet("/health", () => 
{
    return Results.Ok(new { 
        status = "healthy", 
        timestamp = DateTime.UtcNow,
        version = "1.0.0" 
    });
})
.WithName("HealthCheck");

app.Run();