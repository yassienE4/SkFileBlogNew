using SkFileBlogSystem.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;


namespace SkFileBlogSystem.Services;

public class MediaService : IMediaService
{
    private readonly string _mediaPath;
    private readonly IConfiguration _configuration;
    private readonly List<int> _imageSizes;

    public MediaService(IConfiguration configuration)
    {
        _configuration = configuration;
        var contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _mediaPath = Path.Combine(contentPath, "media");
        Directory.CreateDirectory(_mediaPath);
        
        _imageSizes = configuration.GetSection("ImageSizes").Get<List<int>>() ?? new List<int> { 300, 600, 1200 };
    }

    public async Task<ServiceResult<MediaFile>> UploadFileAsync(IFormFile file, string userId)
    {
        try
        {
            if (file == null || file.Length == 0)
                return ServiceResult<MediaFile>.Failure("No file provided");

            // Validate file size (10MB max)
            if (file.Length > 10 * 1024 * 1024)
                return ServiceResult<MediaFile>.Failure("File size exceeds 10MB limit");

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx" };
            
            if (!allowedExtensions.Contains(fileExtension))
                return ServiceResult<MediaFile>.Failure("File type not allowed");

            var mediaFile = new MediaFile
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                UploadedBy = userId,
                UploadedDate = DateTime.UtcNow
            };

            // Determine media type
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            mediaFile.Type = imageExtensions.Contains(fileExtension) ? MediaType.Image : MediaType.Document;

            // Create directory structure
            var yearMonth = DateTime.UtcNow.ToString("yyyy-MM");
            var uploadDir = Path.Combine(_mediaPath, yearMonth);
            Directory.CreateDirectory(uploadDir);

            // Generate unique filename
            var uniqueFileName = $"{mediaFile.Id}{fileExtension}";
            var filePath = Path.Combine(uploadDir, uniqueFileName);
            mediaFile.FilePath = Path.Combine(yearMonth, uniqueFileName);

            // Save original file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Process images
            if (mediaFile.Type == MediaType.Image)
            {
                var imageMetadata = await ProcessImageAsync(filePath, uploadDir, mediaFile.Id);
                mediaFile.ImageMetadata = imageMetadata;
            }

            return ServiceResult<MediaFile>.Success(mediaFile);
        }
        catch (Exception ex)
        {
            return ServiceResult<MediaFile>.Failure($"Upload failed: {ex.Message}");
        }
    }

    public async Task<ServiceResult<bool>> DeleteFileAsync(string fileId)
    {
        try
        {
            // Find and delete file
            // This is a simplified implementation
            return ServiceResult<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return ServiceResult<bool>.Failure($"Delete failed: {ex.Message}");
        }
    }

    private async Task<ImageMetadata> ProcessImageAsync(string originalPath, string uploadDir, string fileId)
    {
        using var image = await Image.LoadAsync(originalPath);
        
        var metadata = new ImageMetadata
        {
            Width = image.Width,
            Height = image.Height
        };

        // Create resized versions
        foreach (var targetWidth in _imageSizes)
        {
            if (image.Width > targetWidth)
            {
                var resizedFileName = $"{fileId}-{targetWidth}w.jpg";
                var resizedPath = Path.Combine(uploadDir, resizedFileName);
                
                var height = (int)(image.Height * ((float)targetWidth / image.Width));
                
                using var resizedImage = image.Clone(ctx => ctx.Resize(targetWidth, height));
                await resizedImage.SaveAsJpegAsync(resizedPath, new SixLabors.ImageSharp.Formats.Jpeg.JpegEncoder { Quality = 85 });
                
                metadata.ResizedVersions[$"{targetWidth}w"] = resizedFileName;
            }
        }

        return metadata;
    }
}