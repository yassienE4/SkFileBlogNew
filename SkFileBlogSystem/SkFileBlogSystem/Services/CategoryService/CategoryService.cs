using System.Text.Json;
using System.Text.RegularExpressions;
using SkFileBlogSystem.Models;


namespace SkFileBlogSystem.Services;

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