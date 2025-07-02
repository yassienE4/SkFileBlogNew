namespace SkFileBlogSystem.Models;

public class Tag
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int PostCount { get; set; }
}