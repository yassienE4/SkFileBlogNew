using System.Text.Json;
using System.Text.RegularExpressions;
using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

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