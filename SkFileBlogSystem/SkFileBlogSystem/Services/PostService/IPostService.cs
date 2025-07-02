using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface IPostService
{
    Task<PagedResult<Post>> GetPostsAsync(int page, int pageSize);
    Task<Post?> GetPostBySlugAsync(string slug);
    Task<ServiceResult<Post>> CreatePostAsync(CreatePostRequest request, string authorId);
    Task<ServiceResult<Post>> UpdatePostAsync(string slug, UpdatePostRequest request);
    Task<ServiceResult<bool>> DeletePostAsync(string slug);
    Task PublishScheduledPostsAsync();
}