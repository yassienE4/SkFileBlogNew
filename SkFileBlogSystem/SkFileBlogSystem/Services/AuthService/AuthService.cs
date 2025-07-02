using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SkFileBlogSystem.Models;


namespace SkFileBlogSystem.Services;

public class AuthService : IAuthService
{
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    public async Task<ServiceResult<User>> RegisterAsync(string username, string email, string password, string firstName, string lastName)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                return ServiceResult<User>.Failure("Username, email, and password are required.");
            }

            if (password.Length < 6)
            {
                return ServiceResult<User>.Failure("Password must be at least 6 characters long.");
            }

            // Check if user already exists
            var existingUser = await _userService.GetUserByUsernameAsync(username);
            if (existingUser != null)
            {
                return ServiceResult<User>.Failure("Username already exists.");
            }

            var existingEmail = await _userService.GetUserByEmailAsync(email);
            if (existingEmail != null)
            {
                return ServiceResult<User>.Failure("Email already exists.");
            }

            // Create user request
            var createUserRequest = new CreateUserRequest
            {
                Username = username,
                Email = email,
                Password = password,
                FirstName = firstName,
                LastName = lastName,
                Role = "User" // Default role for registration
            };

            // Create the user
            var result = await _userService.CreateUserAsync(createUserRequest);
        
            return result.IsSuccess 
                ? ServiceResult<User>.Success(result.Data) 
                : ServiceResult<User>.Failure(result.ErrorMessage);
        }
        catch (Exception ex)
        {
            return ServiceResult<User>.Failure($"Registration failed: {ex.Message}");
        }
    }
    public AuthService(IUserService userService, IConfiguration configuration)
    {
        _userService = userService;
        _configuration = configuration;
        _secretKey = configuration["JwtSettings:SecretKey"] ?? "your-super-secret-key-change-this-in-production";
        _issuer = configuration["JwtSettings:Issuer"] ?? "blog-system";
        _audience = configuration["JwtSettings:Audience"] ?? "blog-system-users";
    }

    public async Task<ServiceResult<AuthResponse>> LoginAsync(string username, string password)
    {
        try
        {
            if (!await _userService.ValidatePasswordAsync(username, password))
                return ServiceResult<AuthResponse>.Failure("Invalid username or password");

            var user = await _userService.GetUserByUsernameAsync(username);
            if (user == null || !user.IsActive)
                return ServiceResult<AuthResponse>.Failure("User not found or inactive");

            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();

            // Update last login date
            user.LastLoginDate = DateTime.UtcNow;
            // In a real app, you'd save this update

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = new UserInfo
                {
                    Id = user.Id,
                    Username = user.Username,
                    DisplayName = user.DisplayName,
                    Role = user.Role.ToString()
                }
            };

            return ServiceResult<AuthResponse>.Success(response);
        }
        catch (Exception ex)
        {
            return ServiceResult<AuthResponse>.Failure($"Login failed: {ex.Message}");
        }
    }

    public async Task<ServiceResult<AuthResponse>> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            // In a real implementation, you'd validate the refresh token from storage
            // For now, we'll just generate new tokens
            
            // This is a simplified implementation
            var response = new AuthResponse
            {
                AccessToken = GenerateAccessToken(new User { Id = "temp", Username = "temp", Role = UserRole.Author.ToString() }),
                RefreshToken = GenerateRefreshToken(),
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            return ServiceResult<AuthResponse>.Success(response);
        }
        catch (Exception ex)
        {
            return ServiceResult<AuthResponse>.Failure($"Token refresh failed: {ex.Message}");
        }
    }

    private string GenerateAccessToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secretKey);
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("DisplayName", user.DisplayName)
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}