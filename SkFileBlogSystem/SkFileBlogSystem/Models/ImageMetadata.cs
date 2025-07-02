namespace SkFileBlogSystem.Models;

public class ImageMetadata
{
    public int Width { get; set; }
    public int Height { get; set; }
    public Dictionary<string, string> ResizedVersions { get; set; } = new();
}