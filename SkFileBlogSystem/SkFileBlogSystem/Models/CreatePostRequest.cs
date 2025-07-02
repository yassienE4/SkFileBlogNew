namespace SkFileBlogSystem.Models;

public class CreatePostRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public List<string> Categories { get; set; } = new();
    public string? CustomUrl { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public DateTime? ScheduledDate { get; set; }
}