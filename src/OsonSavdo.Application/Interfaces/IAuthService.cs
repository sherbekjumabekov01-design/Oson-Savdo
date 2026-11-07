using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default);
    Task<List<UserDto>> GetUsersAsync(CancellationToken ct = default);
    Task<UserDto> CreateUserAsync(CreateUserDto dto, CancellationToken ct = default);
}
