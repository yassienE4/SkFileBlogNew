using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface ITagService
{
    Task<List<Tag>> GetAllTagsAsync();
    Task<PagedResult<Post>?> GetPostsByTagAsync(string slug, int page, int pageSize);
    Task IncrementPostCountAsync(string tagName);
    Task DecrementPostCountAsync(string tagName);
}