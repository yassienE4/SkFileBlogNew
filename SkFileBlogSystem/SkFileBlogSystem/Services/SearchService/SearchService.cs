using SkFileBlogSystem.Models;


namespace SkFileBlogSystem.Services;

public class SearchService(IPostService postService) : ISearchService
{
    public async Task<PagedResult<Post>> SearchPostsAsync(string query, int page, int pageSize)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new PagedResult<Post>();
        }

        // Get all published posts
        var allPosts = await postService.GetPostsAsync(1, int.MaxValue);
        
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