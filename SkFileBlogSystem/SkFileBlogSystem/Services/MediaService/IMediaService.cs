using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface IMediaService
{
    Task<ServiceResult<MediaFile>> UploadFileAsync(IFormFile file, string userId);
    Task<ServiceResult<bool>> DeleteFileAsync(string fileId);
}