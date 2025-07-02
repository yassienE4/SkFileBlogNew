namespace SkFileBlogSystem.Models;

public class SiteConfiguration
{
    public string SiteName { get; set; } = "My Blog";
    public string SiteUrl { get; set; } = "https://myblog.com";
    public string Description { get; set; } = "A personal blog";
    public string Author { get; set; } = "Blog Author";
    public int PostsPerPage { get; set; } = 10;
    public bool EnableComments { get; set; } = false;
    public List<string> ImageSizes { get; set; } = new() { "300", "600", "1200" };
    public string TimeZone { get; set; } = "UTC";
}