using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface ISearchService
{
    Task<PagedResult<Post>> SearchPostsAsync(string query, int page, int pageSize);
    Task IndexPostAsync(Post post);
    Task RemovePostFromIndexAsync(string postId);
    Task RebuildIndexAsync();
    Task<List<string>> GetSuggestionsAsync(string query, int maxSuggestions = 5);
}