using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(dto, ct);
        return Ok(result);
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            // Demo / Dev fallback: agar token berilmagan bo'lsa 1-foydalanuvchini olamiz
            var users = await _authService.GetUsersAsync(ct);
            var firstUser = users.FirstOrDefault();
            if (firstUser != null) return Ok(firstUser);
            return Unauthorized();
        }

        var user = await _authService.GetCurrentUserAsync(userId, ct);
        return Ok(user);
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserDto>>> GetUsers(CancellationToken ct)
    {
        var users = await _authService.GetUsersAsync(ct);
        return Ok(users);
    }

    [HttpPost("users")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto, CancellationToken ct)
    {
        var user = await _authService.CreateUserAsync(dto, ct);
        return CreatedAtAction(nameof(GetMe), new { id = user.Id }, user);
    }
}
