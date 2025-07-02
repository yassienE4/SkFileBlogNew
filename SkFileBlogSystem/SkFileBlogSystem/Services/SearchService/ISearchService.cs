using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface ISearchService
{
    Task<PagedResult<Post>> SearchPostsAsync(string query, int page, int pageSize);
}