
using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface IAuthService
{
    Task<ServiceResult<AuthResponse>> LoginAsync(string username, string password);
    Task<ServiceResult<AuthResponse>> RefreshTokenAsync(string refreshToken);
    Task<ServiceResult<User>> RegisterAsync(string username, string email, string password, string firstName, string lastName);
}