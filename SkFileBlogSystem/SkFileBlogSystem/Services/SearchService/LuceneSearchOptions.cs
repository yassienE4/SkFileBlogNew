namespace SkFileBlogSystem.Services;

public class LuceneSearchOptions
{
    public string IndexPath { get; set; } = "lucene_index";
    public int MaxResults { get; set; } = 1000;
    public bool EnableHighlighting { get; set; } = true;
    public int FragmentSize { get; set; } = 100;
    public int MaxFragments { get; set; } = 3;
}
