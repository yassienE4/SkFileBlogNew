namespace SkFileBlogSystem.Models;

public class MediaFile
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedDate { get; set; } = DateTime.UtcNow;
    public MediaType Type { get; set; }
    public ImageMetadata? ImageMetadata { get; set; }
}