using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public class UserService : IUserService
{
    private readonly string _usersPath;
    private const string PasswordSalt = "SkFileBlog2024SecureSalt!"; // Should be in config
    private readonly ILogger<UserService> _logger;
    public async Task<User?> GetUserByEmailAsync(string email)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            // Normalize email to lowercase for comparison
            var normalizedEmail = email.ToLowerInvariant();
            
            // Search through all user directories
            foreach (var userDir in Directory.GetDirectories(_usersPath))
            {
                var profilePath = Path.Combine(userDir, "profile.json");
                if (File.Exists(profilePath))
                {
                    var user = JsonSerializer.Deserialize<User>(await File.ReadAllTextAsync(profilePath));
                    if (user != null && user.Email.ToLowerInvariant() == normalizedEmail)
                    {
                        return user;
                    }
                }
            }
            
            return null;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error getting user by email: {Email}", email);
            return null;
        }
    }
    public UserService(IConfiguration configuration, ILogger<UserService>? logger = null)
    {
        _logger = logger!;
        var contentPath = configuration["ContentPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "content");
        _usersPath = Path.Combine(contentPath, "users");
        
        _logger?.LogInformation($"UserService initialized with users path: {_usersPath}");
        Directory.CreateDirectory(_usersPath);
        
        _logger?.LogInformation($"Users directory exists: {Directory.Exists(_usersPath)}");
    }

    public async Task<List<User>> GetAllUsersAsync()
    {
        try
        {
            var users = new List<User>();

            _logger?.LogInformation($"Attempting to read users from: {_usersPath}");

            if (!Directory.Exists(_usersPath))
            {
                _logger?.LogWarning($"Users directory does not exist: {_usersPath}");
                return users;
            }

            var userDirectories = Directory.GetDirectories(_usersPath);
            _logger?.LogInformation($"Found {userDirectories.Length} user directories");

            foreach (var userDir in userDirectories)
            {
                var profilePath = Path.Combine(userDir, "profile.json");
                if (File.Exists(profilePath))
                {
                    var user = JsonSerializer.Deserialize<User>(await File.ReadAllTextAsync(profilePath));
                    if (user != null)
                    {
                        user.PasswordHash = string.Empty; // Don't expose password hash
                        users.Add(user);
                    }
                }
                else
                {
                    _logger?.LogWarning($"Profile.json not found in: {userDir}");
                }
            }

            _logger?.LogInformation($"Successfully loaded {users.Count} users");
            return users;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error in GetAllUsersAsync");
            return new List<User>();
        }
    }

    public async Task<User?> GetUserByIdAsync(string id)
    {
        foreach (var userDir in Directory.GetDirectories(_usersPath))
        {
            var profilePath = Path.Combine(userDir, "profile.json");
            if (File.Exists(profilePath))
            {
                var user = JsonSerializer.Deserialize<User>(await File.ReadAllTextAsync(profilePath));
                if (user?.Id == id)
                {
                    user.PasswordHash = string.Empty;
                    return user;
                }
            }
        }

        return null;
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        var userDir = Path.Combine(_usersPath, username.ToLowerInvariant());
        var profilePath = Path.Combine(userDir, "profile.json");
        
        if (File.Exists(profilePath))
        {
            var user = JsonSerializer.Deserialize<User>(await File.ReadAllTextAsync(profilePath));
            return user;
        }

        return null;
    }

    public async Task<ServiceResult<User>> CreateUserAsync(CreateUserRequest request)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Username) || !Regex.IsMatch(request.Username, @"^[a-zA-Z0-9_-]+$"))
                return ServiceResult<User>.Failure("Username must contain only letters, numbers, hyphens, and underscores");

            if (string.IsNullOrWhiteSpace(request.Email) || !Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return ServiceResult<User>.Failure("Invalid email format");

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                return ServiceResult<User>.Failure("Password must be at least 8 characters long");

            // Check if user already exists
            var existingUser = await GetUserByUsernameAsync(request.Username);
            if (existingUser != null)
                return ServiceResult<User>.Failure("Username already exists");

            var userDir = Path.Combine(_usersPath, request.Username.ToLowerInvariant());
            Directory.CreateDirectory(userDir);

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Username = request.Username,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                DisplayName = !string.IsNullOrEmpty(request.DisplayName) ? request.DisplayName : request.Username,
                Role = request.Role,
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            };

            await File.WriteAllTextAsync(Path.Combine(userDir, "profile.json"), 
                JsonSerializer.Serialize(user, new JsonSerializerOptions { WriteIndented = true }));

            user.PasswordHash = string.Empty; // Don't return password hash
            return ServiceResult<User>.Success(user);
        }
        catch (Exception ex)
        {
            return ServiceResult<User>.Failure($"Failed to create user: {ex.Message}");
        }
    }

    public async Task<bool> ValidatePasswordAsync(string username, string password)
    {
        var user = await GetUserByUsernameAsync(username);
        if (user == null || !user.IsActive)
            return false;

        return VerifyPassword(password, user.PasswordHash);
    }

    private string HashPassword(string password)
    {
        // Using PBKDF2 for better security
        using var rfc2898 = new Rfc2898DeriveBytes(password, Encoding.UTF8.GetBytes(PasswordSalt), 10000, HashAlgorithmName.SHA256);
        return Convert.ToBase64String(rfc2898.GetBytes(32));
    }

    private bool VerifyPassword(string password, string hash)
    {
        var passwordHash = HashPassword(password);
        return passwordHash == hash;
    }
}