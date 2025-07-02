namespace SkFileBlogSystem.Models;

public class Post
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public DateTime? ScheduledDate { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<string> Categories { get; set; } = new();
    public string? CustomUrl { get; set; }
    public List<string> Assets { get; set; } = new();
}