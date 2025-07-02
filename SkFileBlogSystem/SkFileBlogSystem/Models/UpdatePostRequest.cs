namespace SkFileBlogSystem.Models;

public class UpdatePostRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Content { get; set; }
    public List<string>? Tags { get; set; }
    public List<string>? Categories { get; set; }
    public string? CustomUrl { get; set; }
    public PostStatus? Status { get; set; }
    public DateTime? ScheduledDate { get; set; }
}