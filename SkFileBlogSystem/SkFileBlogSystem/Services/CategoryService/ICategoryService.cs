using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface ICategoryService
{
    Task<List<Category>> GetAllCategoriesAsync();
    Task<Category?> GetCategoryBySlugAsync(string slug);
    Task<PagedResult<Post>?> GetPostsByCategoryAsync(string slug, int page, int pageSize);
    Task IncrementPostCountAsync(string categoryName);
    Task DecrementPostCountAsync(string categoryName);
}