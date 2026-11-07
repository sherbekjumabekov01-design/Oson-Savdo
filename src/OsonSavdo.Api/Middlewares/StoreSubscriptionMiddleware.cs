using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Infrastructure.Data;

namespace OsonSavdo.Api.Middlewares;

public class StoreSubscriptionMiddleware
{
    private readonly RequestDelegate _next;

    public StoreSubscriptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";

        // Ochiq yo'llar (Swagger, Login, SuperAdmin Stores API, Backup) tekshirilmaydi
        if (path.StartsWith("/swagger") ||
            path.StartsWith("/api/auth/login") ||
            path.StartsWith("/api/stores") ||
            path.StartsWith("/api/backup"))
        {
            await _next(context);
            return;
        }

        // Foydalanuvchi SuperAdmin bo'lsa, obuna tekshiruvidan o'tadi
        var role = context.User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == UserRole.SuperAdmin.ToString())
        {
            await _next(context);
            return;
        }

        // Do'kon ID sini aniqlash
        int? storeId = null;
        if (context.Request.Headers.TryGetValue("X-Store-Id", out var headerVal) && int.TryParse(headerVal, out var hId))
        {
            storeId = hId;
        }
        else if (int.TryParse(context.User.FindFirst("storeId")?.Value, out var tId))
        {
            storeId = tId;
        }

        if (storeId.HasValue && storeId.Value > 0)
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var store = await db.Stores.AsNoTracking().FirstOrDefaultAsync(s => s.Id == storeId.Value);
            if (store != null)
            {
                var now = DateTime.UtcNow;
                var isExpired = store.SubscriptionExpiresAt.HasValue && store.SubscriptionExpiresAt.Value < now;

                if (!store.IsActive || isExpired)
                {
                    context.Response.ContentType = "application/json";
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;

                    var response = new
                    {
                        statusCode = 403,
                        success = false,
                        isSubscriptionExpired = true,
                        storeId = store.Id,
                        storeName = store.Name,
                        expiredAt = store.SubscriptionExpiresAt,
                        monthlyFee = store.MonthlyFee,
                        error = isExpired
                            ? $"'{store.Name}' do'konining 1 oylik obuna muddati ({store.SubscriptionExpiresAt:dd.MM.yyyy}) tugadi va tizim avtomatik to'xtatildi (xuddi SIM-karta kabi). Xizmatni davom ettirish uchun to'lovni amalga oshiring."
                            : $"'{store.Name}' do'koni platforma ma'muriyati tomonidan to'xtatilgan (bloklangan)."
                    };

                    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                    return;
                }
            }
        }

        await _next(context);
    }
}
