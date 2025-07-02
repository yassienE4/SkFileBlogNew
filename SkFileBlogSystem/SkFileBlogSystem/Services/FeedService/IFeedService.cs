namespace SkFileBlogSystem.Services;

public interface IFeedService
{
    Task<string> GenerateRssFeedAsync();
    Task<string> GenerateAtomFeedAsync();
}