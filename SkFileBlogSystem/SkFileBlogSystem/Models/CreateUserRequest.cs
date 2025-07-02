namespace SkFileBlogSystem.Models;

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = UserRole.Author.ToString();
    public string FirstName { get; set; }
    public string LastName { get; set; }
}