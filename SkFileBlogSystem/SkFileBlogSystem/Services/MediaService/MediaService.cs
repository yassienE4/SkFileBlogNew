using SkFileBlogSystem.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System.Text.Json;

namespace SkFileBlogSystem.Services;

public class MediaService : IMediaService
{
    private readonly string _mediaPath;
    private readonly string _metadataPath;
    private readonly IConfiguration _configuration;
    private readonly List<int> _imageSizes;

    public MediaService(IConfiguration configuration)
    {
        _configuration = configuration;
        var contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _mediaPath = Path.Combine(contentPath, "media");
        _metadataPath = Path.Combine(contentPath, "media", "metadata");
        Directory.CreateDirectory(_mediaPath);
        Directory.CreateDirectory(_metadataPath);
        
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

            // Save metadata
            await SaveMediaMetadataAsync(mediaFile);

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
            var mediaFile = await GetFileAsync(fileId);
            if (mediaFile == null)
                return ServiceResult<bool>.Failure("File not found");

            // Delete main file
            var fullPath = Path.Combine(_mediaPath, mediaFile.FilePath);
            if (File.Exists(fullPath))
                File.Delete(fullPath);

            // Delete resized versions if it's an image
            if (mediaFile.Type == MediaType.Image && mediaFile.ImageMetadata?.ResizedVersions != null)
            {
                var directory = Path.GetDirectoryName(fullPath);
                if (directory != null)
                {
                    foreach (var resizedVersion in mediaFile.ImageMetadata.ResizedVersions.Values)
                    {
                        var resizedPath = Path.Combine(directory, resizedVersion);
                        if (File.Exists(resizedPath))
                            File.Delete(resizedPath);
                    }
                }
            }

            // Delete metadata
            var metadataFile = Path.Combine(_metadataPath, $"{fileId}.json");
            if (File.Exists(metadataFile))
                File.Delete(metadataFile);

            return ServiceResult<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return ServiceResult<bool>.Failure($"Delete failed: {ex.Message}");
        }
    }

    public async Task<MediaFile?> GetFileAsync(string fileId)
    {
        try
        {
            var metadataFile = Path.Combine(_metadataPath, $"{fileId}.json");
            if (!File.Exists(metadataFile))
                return null;

            var json = await File.ReadAllTextAsync(metadataFile);
            return JsonSerializer.Deserialize<MediaFile>(json);
        }
        catch
        {
            return null;
        }
    }

    public async Task<(Stream? Stream, string ContentType, string FileName)?> GetFileStreamAsync(string filePath)
    {
        try
        {
            var fullPath = Path.Combine(_mediaPath, filePath);
            if (!File.Exists(fullPath))
                return null;

            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
            var fileName = Path.GetFileName(filePath);
            
            // Determine content type
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };

            return (stream, contentType, fileName);
        }
        catch
        {
            return null;
        }
    }

    public async Task<IEnumerable<MediaFile>> GetAllFilesAsync()
    {
        var mediaFiles = new List<MediaFile>();
        
        try
        {
            if (!Directory.Exists(_metadataPath))
                return mediaFiles;

            var metadataFiles = Directory.GetFiles(_metadataPath, "*.json");
            
            foreach (var metadataFile in metadataFiles)
            {
                try
                {
                    var json = await File.ReadAllTextAsync(metadataFile);
                    var mediaFile = JsonSerializer.Deserialize<MediaFile>(json);
                    if (mediaFile != null)
                        mediaFiles.Add(mediaFile);
                }
                catch
                {
                    // Skip corrupted metadata files
                }
            }
        }
        catch
        {
            // Return empty list on error
        }

        return mediaFiles.OrderByDescending(f => f.UploadedDate);
    }

    public async Task<IEnumerable<MediaFile>> GetFilesByUserAsync(string userId)
    {
        var allFiles = await GetAllFilesAsync();
        return allFiles.Where(f => f.UploadedBy == userId);
    }

    private async Task SaveMediaMetadataAsync(MediaFile mediaFile)
    {
        var metadataFile = Path.Combine(_metadataPath, $"{mediaFile.Id}.json");
        var json = JsonSerializer.Serialize(mediaFile, new JsonSerializerOptions 
        { 
            WriteIndented = true 
        });
        await File.WriteAllTextAsync(metadataFile, json);
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