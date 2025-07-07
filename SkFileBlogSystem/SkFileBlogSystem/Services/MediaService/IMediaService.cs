using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface IMediaService
{
    Task<ServiceResult<MediaFile>> UploadFileAsync(IFormFile file, string userId);
    Task<ServiceResult<bool>> DeleteFileAsync(string fileId);
    Task<MediaFile?> GetFileAsync(string fileId);
    Task<(Stream? Stream, string ContentType, string FileName)?> GetFileStreamAsync(string filePath);
    Task<IEnumerable<MediaFile>> GetAllFilesAsync();
    Task<IEnumerable<MediaFile>> GetFilesByUserAsync(string userId);
}