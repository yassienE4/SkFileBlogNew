using System.Text.Json;
using System.Xml.Linq;
using Markdig;
using SkFileBlogSystem.Models;


namespace SkFileBlogSystem.Services;

public class FeedService : IFeedService
{
    private readonly IPostService _postService;
    private readonly IConfiguration _configuration;
    private readonly SiteConfiguration _siteConfig;

    public FeedService(IPostService postService, IConfiguration configuration)
    {
        _postService = postService;
        _configuration = configuration;
        
        // Load site configuration
        var configPath = Path.Combine(configuration["ContentPath"] ?? "content", "config", "site.json");
        if (File.Exists(configPath))
        {
            var json = File.ReadAllText(configPath);
            _siteConfig = JsonSerializer.Deserialize<SiteConfiguration>(json) ?? new SiteConfiguration();
        }
        else
        {
            _siteConfig = new SiteConfiguration();
        }
    }

    public async Task<string> GenerateRssFeedAsync()
    {
        var posts = await _postService.GetPostsAsync(1, 20);
        var markdown = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();

        var rss = new XElement("rss",
            new XAttribute("version", "2.0"),
            new XElement("channel",
                new XElement("title", _siteConfig.SiteName),
                new XElement("link", _siteConfig.SiteUrl),
                new XElement("description", _siteConfig.Description),
                new XElement("language", "en-US"),
                new XElement("lastBuildDate", DateTime.UtcNow.ToString("R")),
                posts.Items.Select(post => new XElement("item",
                    new XElement("title", post.Title),
                    new XElement("link", $"{_siteConfig.SiteUrl}/posts/{post.Slug}"),
                    new XElement("description", post.Description),
                    new XElement("content:encoded", 
                        new XCData(Markdown.ToHtml(post.Content, markdown))),
                    new XElement("pubDate", post.PublishedDate.ToString("R")),
                    new XElement("guid", $"{_siteConfig.SiteUrl}/posts/{post.Slug}"),
                    post.Categories.Select(cat => new XElement("category", cat))
                ))
            )
        );

        return new XDocument(new XDeclaration("1.0", "utf-8", null), rss).ToString();
    }

    public async Task<string> GenerateAtomFeedAsync()
    {
        var posts = await _postService.GetPostsAsync(1, 20);
        var markdown = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();

        XNamespace atom = "http://www.w3.org/2005/Atom";

        var feed = new XElement(atom + "feed",
            new XElement(atom + "title", _siteConfig.SiteName),
            new XElement(atom + "link", 
                new XAttribute("href", _siteConfig.SiteUrl),
                new XAttribute("rel", "alternate")),
            new XElement(atom + "link",
                new XAttribute("href", $"{_siteConfig.SiteUrl}/feed/atom"),
                new XAttribute("rel", "self")),
            new XElement(atom + "id", _siteConfig.SiteUrl),
            new XElement(atom + "updated", DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")),
            new XElement(atom + "subtitle", _siteConfig.Description),
            posts.Items.Select(post => new XElement(atom + "entry",
                new XElement(atom + "title", post.Title),
                new XElement(atom + "link",
                    new XAttribute("href", $"{_siteConfig.SiteUrl}/posts/{post.Slug}")),
                new XElement(atom + "id", $"{_siteConfig.SiteUrl}/posts/{post.Slug}"),
                new XElement(atom + "updated", post.ModifiedDate.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")),
                new XElement(atom + "published", post.PublishedDate.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")),
                new XElement(atom + "author",
                    new XElement(atom + "name", post.AuthorName)),
                new XElement(atom + "summary", post.Description),
                new XElement(atom + "content",
                    new XAttribute("type", "html"),
                    new XCData(Markdown.ToHtml(post.Content, markdown))),
                post.Categories.Select(cat => new XElement(atom + "category",
                    new XAttribute("term", cat)))
            ))
        );

        return new XDocument(new XDeclaration("1.0", "utf-8", null), feed).ToString();
    }
}