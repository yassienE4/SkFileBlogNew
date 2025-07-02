namespace SkFileBlogSystem.Models;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = UserRole.Author.ToString();
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime LastLoginDate { get; set; }
    public bool IsActive { get; set; } = true;
}