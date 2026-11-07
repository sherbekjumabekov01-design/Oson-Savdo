using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Application.DTOs;

public record LoginDto(string Username, string Password);

public record LoginResponseDto(
    string Token,
    int UserId,
    string Username,
    string FullName,
    UserRole Role,
    DateTime ExpiresAt,
    int? StoreId = null,
    string? StoreName = null
);

public record UserDto(
    int Id,
    string Username,
    string FullName,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    int? StoreId = null,
    string? StoreName = null
);

public record CreateUserDto(
    string Username,
    string Password,
    string FullName,
    UserRole Role,
    int? StoreId = null
);

