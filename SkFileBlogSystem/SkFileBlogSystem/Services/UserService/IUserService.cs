using SkFileBlogSystem.Models;

namespace SkFileBlogSystem.Services;

public interface IUserService
{
    Task<User?> GetUserByEmailAsync(string email); // Add this line
    Task<List<User>> GetAllUsersAsync();
    Task<User?> GetUserByIdAsync(string id);
    Task<User?> GetUserByUsernameAsync(string username);
    Task<ServiceResult<User>> CreateUserAsync(CreateUserRequest request);
    Task<bool> ValidatePasswordAsync(string username, string password);
}