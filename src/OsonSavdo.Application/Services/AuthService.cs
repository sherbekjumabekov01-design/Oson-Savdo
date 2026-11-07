using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _db;
    public const string DefaultSecretKey = "OsonSavdo_Super_Secret_Key_For_Jwt_Auth_2026_Secure_Key!";
    public const string Issuer = "OsonSavdoApi";
    public const string Audience = "OsonSavdoClient";

    public AuthService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            throw new BusinessException("Login va parol kiritilishi shart.");

        var trimmedUsername = dto.Username.Trim().ToLower();
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == trimmedUsername, ct);

        if (user == null)
            throw new BusinessException("Login yoki parol noto'g'ri.");

        var passwordHash = HashPassword(dto.Password);
        if (user.PasswordHash != passwordHash)
            throw new BusinessException("Login yoki parol noto'g'ri.");

        if (!user.IsActive)
            throw new BusinessException("Ushbu foydalanuvchi hisobi faol emas.");

        string? storeName = null;
        if (user.Role != UserRole.SuperAdmin && user.StoreId.HasValue)
        {
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == user.StoreId.Value, ct);
            if (store == null)
                throw new BusinessException("Foydalanuvchiga biriktirilgan do'kon topilmadi.");

            if (!store.IsActive)
                throw new BusinessException($"'{store.Name}' do'koni ma'muriyat tomonidan to'xtatilgan (bloklangan). Xizmat ko'rsatuvchi bilan bog'laning.");

            if (store.SubscriptionExpiresAt.HasValue && store.SubscriptionExpiresAt.Value < DateTime.UtcNow)
                throw new BusinessException($"'{store.Name}' do'konining obuna muddati ({store.SubscriptionExpiresAt.Value:dd.MM.yyyy}) tugagan. Iltimos, obunani uzaytiring.");

            storeName = store.Name;
        }
        else if (user.Role == UserRole.SuperAdmin)
        {
            storeName = "SaaS Platforma Markazi";
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var expiresAt = DateTime.UtcNow.AddDays(7);
        var token = GenerateJwtToken(user, expiresAt);

        return new LoginResponseDto(
            Token: token,
            UserId: user.Id,
            Username: user.Username,
            FullName: user.FullName,
            Role: user.Role,
            ExpiresAt: expiresAt,
            StoreId: user.StoreId,
            StoreName: storeName
        );
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().Include(u => u.Store).FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
            throw new NotFoundException("Foydalanuvchi topilmadi.");

        return MapToDto(user);
    }

    public async Task<List<UserDto>> GetUsersAsync(CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .Include(u => u.Store)
            .OrderBy(u => u.FullName)
            .Select(u => MapToDto(u))
            .ToListAsync(ct);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto, CancellationToken ct = default)
    {
        var trimmedUsername = dto.Username.Trim().ToLower();
        var exists = await _db.Users.AnyAsync(u => u.Username.ToLower() == trimmedUsername, ct);
        if (exists)
            throw new BusinessException($"'{trimmedUsername}' logini bilan foydalanuvchi allaqachon mavjud.");

        var user = new User
        {
            Username = trimmedUsername,
            PasswordHash = HashPassword(dto.Password),
            FullName = dto.FullName.Trim(),
            Role = dto.Role,
            StoreId = dto.StoreId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return MapToDto(user);
    }

    public static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }

    private static string GenerateJwtToken(User user, DateTime expiresAt)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(DefaultSecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("username", user.Username)
        };

        if (user.StoreId.HasValue)
        {
            claims.Add(new Claim("storeId", user.StoreId.Value.ToString()));
        }

        var tokenDescriptor = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }

    private static UserDto MapToDto(User u) => new(
        Id: u.Id,
        Username: u.Username,
        FullName: u.FullName,
        Role: u.Role,
        IsActive: u.IsActive,
        CreatedAt: u.CreatedAt,
        LastLoginAt: u.LastLoginAt,
        StoreId: u.StoreId,
        StoreName: u.Store?.Name
    );
}
