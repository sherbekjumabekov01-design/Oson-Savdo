using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Api.Services;

public class CurrentStoreContext : ICurrentStoreContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentStoreContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? StoreId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            // 1. Header (SuperAdmin do'konni tanlaganda yoki frontend X-Store-Id berganda)
            if (httpContext.Request.Headers.TryGetValue("X-Store-Id", out var headerVal) &&
                int.TryParse(headerVal, out var sId) && sId > 0)
            {
                return sId;
            }

            // 2. Query parametr ?storeId=
            if (httpContext.Request.Query.TryGetValue("storeId", out var queryVal) &&
                int.TryParse(queryVal, out var qId) && qId > 0)
            {
                return qId;
            }

            // 3. Foydalanuvchining JWT tokenidagi claim
            var claim = httpContext.User.FindFirst("storeId")?.Value;
            if (int.TryParse(claim, out var tokenStoreId) && tokenStoreId > 0)
            {
                return tokenStoreId;
            }

            return null;
        }
    }

    public string? Role => _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value;

    public bool IsSuperAdmin => Role == UserRole.SuperAdmin.ToString();
}
