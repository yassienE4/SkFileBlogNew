using System.Net;
using System.Text.Json;
using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = new
        {
            status = context.Response.StatusCode,
            message = "An error occurred while processing your request.",
            details = exception.Message // In production, you might want to hide this
        };

        var jsonResponse = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(jsonResponse);
    }
}

public static class ValidationHelpers
{
    public static bool IsValidSlug(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        // Slug should only contain lowercase letters, numbers, and hyphens
        return System.Text.RegularExpressions.Regex.IsMatch(slug, @"^[a-z0-9]+(?:-[a-z0-9]+)*$");
    }

    public static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        return System.Text.RegularExpressions.Regex.IsMatch(email, 
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
    }

    public static bool IsValidUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return false;

        // Username should only contain letters, numbers, hyphens, and underscores
        return System.Text.RegularExpressions.Regex.IsMatch(username, @"^[a-zA-Z0-9_-]+$");
    }

    public static string SanitizeHtml(string html)
    {
        // In a real application, you'd want to use a proper HTML sanitizer library
        // This is a very basic implementation
        if (string.IsNullOrWhiteSpace(html))
            return string.Empty;

        // Remove script tags and their content
        html = System.Text.RegularExpressions.Regex.Replace(html, 
            @"<script[^>]*>[\s\S]*?</script>", "", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        // Remove style tags and their content
        html = System.Text.RegularExpressions.Regex.Replace(html, 
            @"<style[^>]*>[\s\S]*?</style>", "", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        // Remove onclick and other event attributes
        html = System.Text.RegularExpressions.Regex.Replace(html, 
            @"\s*on\w+\s*=\s*""[^""]*""", "", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        html = System.Text.RegularExpressions.Regex.Replace(html, 
            @"\s*on\w+\s*=\s*'[^']*'", "", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        return html;
    }

    public static string GenerateUrlSafeToken(int length = 32)
    {
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        var bytes = new byte[length];
        rng.GetBytes(bytes);
        
        // Convert to URL-safe base64
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", "");
    }
}

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly Dictionary<string, List<DateTime>> _requestTimes = new();
    private readonly int _requestLimit;
    private readonly TimeSpan _timeWindow;
    private readonly object _lock = new();

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger, 
        int requestLimit = 100, int timeWindowMinutes = 1)
    {
        _next = next;
        _logger = logger;
        _requestLimit = requestLimit;
        _timeWindow = TimeSpan.FromMinutes(timeWindowMinutes);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTime.UtcNow;

        lock (_lock)
        {
            if (!_requestTimes.ContainsKey(clientIp))
            {
                _requestTimes[clientIp] = new List<DateTime>();
            }

            var requests = _requestTimes[clientIp];
            
            // Remove old requests outside the time window
            requests.RemoveAll(time => now - time > _timeWindow);

            if (requests.Count >= _requestLimit)
            {
                context.Response.StatusCode = 429; // Too Many Requests
                context.Response.ContentType = "application/json";
                var response = JsonSerializer.Serialize(new { message = "Rate limit exceeded. Please try again later." });
                context.Response.WriteAsync(response).Wait();
                return;
            }

            requests.Add(now);
        }

        await _next(context);
    }
}

public class CompressionMiddleware
{
    private readonly RequestDelegate _next;

    public CompressionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var acceptEncoding = context.Request.Headers["Accept-Encoding"].ToString();
        
        if (acceptEncoding.Contains("gzip"))
        {
            context.Response.Headers.Add("Content-Encoding", "gzip");
            
            using var originalBody = context.Response.Body;
            using var compressedBody = new MemoryStream();
            
            context.Response.Body = compressedBody;
            
            await _next(context);
            
            using var gzipStream = new System.IO.Compression.GZipStream(originalBody, 
                System.IO.Compression.CompressionMode.Compress);
            
            compressedBody.Seek(0, SeekOrigin.Begin);
            await compressedBody.CopyToAsync(gzipStream);
        }
        else
        {
            await _next(context);
        }
    }
}