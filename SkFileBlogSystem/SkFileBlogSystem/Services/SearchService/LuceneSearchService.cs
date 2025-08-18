using Lucene.Net.Analysis;
using Lucene.Net.Analysis.Standard;
using Lucene.Net.Documents;
using Lucene.Net.Index;
using Lucene.Net.QueryParsers.Classic;
using Lucene.Net.Search;
using Lucene.Net.Search.Highlight;
using Lucene.Net.Store;
using Lucene.Net.Util;
using Microsoft.Extensions.Options;
using SkFileBlogSystem.Models;
using System.Text;

namespace SkFileBlogSystem.Services;

public class LuceneSearchService : ISearchService, IDisposable
{
    private const LuceneVersion AppLuceneVersion = LuceneVersion.LUCENE_48;
    
    private readonly IPostService _postService;
    private readonly LuceneSearchOptions _options;
    private readonly FSDirectory _directory;
    private readonly Analyzer _analyzer;
    private readonly ILogger<LuceneSearchService> _logger;
    private IndexWriter? _indexWriter;
    private readonly object _indexLock = new();

    public LuceneSearchService(
        IPostService postService, 
        IOptions<LuceneSearchOptions> options,
        ILogger<LuceneSearchService> logger)
    {
        _postService = postService;
        _options = options.Value;
        _logger = logger;

        // Create directory for Lucene index
        var indexPath = Path.Combine(System.IO.Directory.GetCurrentDirectory(), _options.IndexPath);
        System.IO.Directory.CreateDirectory(indexPath);
        _directory = FSDirectory.Open(indexPath);
        
        // Create analyzer
        _analyzer = new StandardAnalyzer(AppLuceneVersion);
        
        // Initialize index if it doesn't exist
        InitializeIndex();
    }

    private void InitializeIndex()
    {
        lock (_indexLock)
        {
            var indexConfig = new IndexWriterConfig(AppLuceneVersion, _analyzer);
            
            if (!DirectoryReader.IndexExists(_directory))
            {
                indexConfig.OpenMode = OpenMode.CREATE;
                _logger.LogInformation("Creating new Lucene index");
            }
            else
            {
                indexConfig.OpenMode = OpenMode.CREATE_OR_APPEND;
                _logger.LogInformation("Opening existing Lucene index");
            }

            _indexWriter = new IndexWriter(_directory, indexConfig);
            _indexWriter.Commit();
        }
    }

    public async Task<PagedResult<Post>> SearchPostsAsync(string query, int page, int pageSize)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new PagedResult<Post>();
        }

        try
        {
            using var reader = DirectoryReader.Open(_directory);
            var searcher = new IndexSearcher(reader);
            
            // Create query parser for multiple fields
            var queryParser = new MultiFieldQueryParser(
                AppLuceneVersion,
                new[] { "title", "description", "content", "tags", "categories", "authorName" },
                _analyzer,
                new Dictionary<string, float>
                {
                    { "title", 3.0f },
                    { "description", 2.0f },
                    { "content", 1.0f },
                    { "tags", 2.5f },
                    { "categories", 2.0f },
                    { "authorName", 1.5f }
                });

            var luceneQuery = queryParser.Parse(QueryParserBase.Escape(query));
            
            // Create a filter for published posts only
            var publishedFilter = new TermQuery(new Term("status", PostStatus.Published.ToString()));
            var filteredQuery = new BooleanQuery
            {
                { luceneQuery, Occur.MUST },
                { publishedFilter, Occur.MUST }
            };

            // Execute search
            var topDocs = searcher.Search(filteredQuery, _options.MaxResults, 
                new Sort(new SortField("publishedDate", SortFieldType.INT64, true)));

            var totalCount = topDocs.TotalHits;
            var posts = new List<Post>();

            // Calculate pagination
            var startIndex = (page - 1) * pageSize;
            var endIndex = Math.Min(startIndex + pageSize, topDocs.ScoreDocs.Length);

            // Create highlighter for search result highlighting
            Highlighter? highlighter = null;
            if (_options.EnableHighlighting)
            {
                var formatter = new SimpleHTMLFormatter("<mark>", "</mark>");
                var scorer = new QueryScorer(luceneQuery);
                highlighter = new Highlighter(formatter, scorer);
                highlighter.TextFragmenter = new SimpleFragmenter(_options.FragmentSize);
            }

            for (int i = startIndex; i < endIndex; i++)
            {
                var scoreDoc = topDocs.ScoreDocs[i];
                var doc = searcher.Doc(scoreDoc.Doc);
                
                var post = DocumentToPost(doc);
                
                // Add highlighting if enabled
                if (highlighter != null && post != null)
                {
                    var titleHighlight = highlighter.GetBestFragment(_analyzer, "title", post.Title);
                    var descriptionHighlight = highlighter.GetBestFragment(_analyzer, "description", post.Description);
                    
                    if (!string.IsNullOrEmpty(titleHighlight))
                        post.Title = titleHighlight;
                    if (!string.IsNullOrEmpty(descriptionHighlight))
                        post.Description = descriptionHighlight;
                }
                
                if (post != null)
                    posts.Add(post);
            }

            return new PagedResult<Post>
            {
                Items = posts,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching posts with query: {Query}", query);
            // Fallback to simple search if Lucene fails
            return await FallbackSearchAsync(query, page, pageSize);
        }
    }

    public async Task IndexPostAsync(Post post)
    {
        if (post == null) return;

        try
        {
            lock (_indexLock)
            {
                // Remove existing document if it exists
                _indexWriter?.DeleteDocuments(new Term("id", post.Id));
                
                // Create new document
                var doc = PostToDocument(post);
                _indexWriter?.AddDocument(doc);
                _indexWriter?.Commit();
            }
            
            _logger.LogDebug("Indexed post: {PostId} - {PostTitle}", post.Id, post.Title);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error indexing post: {PostId}", post.Id);
        }
    }

    public async Task RemovePostFromIndexAsync(string postId)
    {
        if (string.IsNullOrWhiteSpace(postId)) return;

        try
        {
            lock (_indexLock)
            {
                _indexWriter?.DeleteDocuments(new Term("id", postId));
                _indexWriter?.Commit();
            }
            
            _logger.LogDebug("Removed post from index: {PostId}", postId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing post from index: {PostId}", postId);
        }
    }

    public async Task RebuildIndexAsync()
    {
        try
        {
            _logger.LogInformation("Starting index rebuild");
            
            lock (_indexLock)
            {
                _indexWriter?.DeleteAll();
                _indexWriter?.Commit();
            }

            // Get all published posts
            var allPosts = await _postService.GetPostsAsync(1, int.MaxValue);
            var publishedPosts = allPosts.Items.Where(p => p.Status == PostStatus.Published);

            foreach (var post in publishedPosts)
            {
                await IndexPostAsync(post);
            }

            _logger.LogInformation("Index rebuild completed. Indexed {PostCount} posts", publishedPosts.Count());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rebuilding index");
            throw;
        }
    }

    public async Task<List<string>> GetSuggestionsAsync(string query, int maxSuggestions = 5)
    {
        if (string.IsNullOrWhiteSpace(query))
            return new List<string>();

        try
        {
            using var reader = DirectoryReader.Open(_directory);
            var searcher = new IndexSearcher(reader);
            
            // Simple suggestion based on wildcard prefix search on titles
            var suggestions = new HashSet<string>();
            var queryLower = query.ToLowerInvariant();
            
            // Use a prefix query to find matching titles
            var prefixQuery = new PrefixQuery(new Term("title", queryLower));
            var topDocs = searcher.Search(prefixQuery, maxSuggestions);
            
            foreach (var scoreDoc in topDocs.ScoreDocs)
            {
                var doc = searcher.Doc(scoreDoc.Doc);
                var title = doc.Get("title");
                if (!string.IsNullOrEmpty(title) && suggestions.Count < maxSuggestions)
                {
                    suggestions.Add(title);
                }
            }

            return suggestions.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting suggestions for query: {Query}", query);
            return new List<string>();
        }
    }

    private Document PostToDocument(Post post)
    {
        var doc = new Document();
        
        // Store fields that we want to retrieve
        doc.Add(new StringField("id", post.Id, Field.Store.YES));
        doc.Add(new TextField("title", post.Title, Field.Store.YES));
        doc.Add(new TextField("slug", post.Slug, Field.Store.YES));
        doc.Add(new TextField("description", post.Description, Field.Store.YES));
        doc.Add(new TextField("content", StripHtml(post.Content), Field.Store.YES));
        doc.Add(new StringField("authorId", post.AuthorId, Field.Store.YES));
        doc.Add(new TextField("authorName", post.AuthorName, Field.Store.YES));
        doc.Add(new StringField("status", post.Status.ToString(), Field.Store.YES));
        doc.Add(new StringField("customUrl", post.CustomUrl ?? "", Field.Store.YES));
        
        // Date fields for sorting
        doc.Add(new Int64Field("publishedDate", post.PublishedDate.Ticks, Field.Store.YES));
        doc.Add(new Int64Field("modifiedDate", post.ModifiedDate.Ticks, Field.Store.YES));
        
        if (post.ScheduledDate.HasValue)
        {
            doc.Add(new Int64Field("scheduledDate", post.ScheduledDate.Value.Ticks, Field.Store.YES));
        }
        
        // Tags and Categories as searchable text
        if (post.Tags.Any())
        {
            doc.Add(new TextField("tags", string.Join(" ", post.Tags), Field.Store.YES));
        }
        
        if (post.Categories.Any())
        {
            doc.Add(new TextField("categories", string.Join(" ", post.Categories), Field.Store.YES));
        }
        
        if (post.Assets.Any())
        {
            doc.Add(new TextField("assets", string.Join(" ", post.Assets), Field.Store.YES));
        }

        return doc;
    }

    private Post? DocumentToPost(Document doc)
    {
        try
        {
            var post = new Post
            {
                Id = doc.Get("id") ?? "",
                Title = doc.Get("title") ?? "",
                Slug = doc.Get("slug") ?? "",
                Description = doc.Get("description") ?? "",
                Content = doc.Get("content") ?? "",
                AuthorId = doc.Get("authorId") ?? "",
                AuthorName = doc.Get("authorName") ?? "",
                CustomUrl = doc.Get("customUrl")
            };

            // Parse status
            if (Enum.TryParse<PostStatus>(doc.Get("status"), out var status))
            {
                post.Status = status;
            }

            // Parse dates
            if (long.TryParse(doc.Get("publishedDate"), out var publishedTicks))
            {
                post.PublishedDate = new DateTime(publishedTicks);
            }

            if (long.TryParse(doc.Get("modifiedDate"), out var modifiedTicks))
            {
                post.ModifiedDate = new DateTime(modifiedTicks);
            }

            if (long.TryParse(doc.Get("scheduledDate"), out var scheduledTicks))
            {
                post.ScheduledDate = new DateTime(scheduledTicks);
            }

            // Parse collections
            var tags = doc.Get("tags");
            if (!string.IsNullOrEmpty(tags))
            {
                post.Tags = tags.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
            }

            var categories = doc.Get("categories");
            if (!string.IsNullOrEmpty(categories))
            {
                post.Categories = categories.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
            }

            var assets = doc.Get("assets");
            if (!string.IsNullOrEmpty(assets))
            {
                post.Assets = assets.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
            }

            return post;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting document to post");
            return null;
        }
    }

    private async Task<PagedResult<Post>> FallbackSearchAsync(string query, int page, int pageSize)
    {
        // Fallback to the original simple search implementation
        var allPosts = await _postService.GetPostsAsync(1, int.MaxValue);
        
        var searchTerms = query.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        
        var matchedPosts = allPosts.Items.Where(post =>
        {
            var searchableContent = $"{post.Title} {post.Description} {post.Content} {string.Join(" ", post.Tags)} {string.Join(" ", post.Categories)}".ToLowerInvariant();
            return searchTerms.All(term => searchableContent.Contains(term));
        })
        .OrderByDescending(post => post.PublishedDate)
        .ToList();

        var totalCount = matchedPosts.Count;
        var pagedPosts = matchedPosts.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PagedResult<Post>
        {
            Items = pagedPosts,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html))
            return string.Empty;

        // Simple HTML stripping - you might want to use a more robust solution
        var result = new StringBuilder();
        bool insideTag = false;
        
        foreach (char c in html)
        {
            if (c == '<')
            {
                insideTag = true;
            }
            else if (c == '>')
            {
                insideTag = false;
            }
            else if (!insideTag)
            {
                result.Append(c);
            }
        }
        
        return result.ToString().Trim();
    }

    public void Dispose()
    {
        lock (_indexLock)
        {
            _indexWriter?.Dispose();
            _analyzer?.Dispose();
            _directory?.Dispose();
        }
    }
}
