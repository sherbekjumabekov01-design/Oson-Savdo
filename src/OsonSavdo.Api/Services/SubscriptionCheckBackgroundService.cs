using Microsoft.EntityFrameworkCore;
using OsonSavdo.Infrastructure.Data;

namespace OsonSavdo.Api.Services;

public class SubscriptionCheckBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SubscriptionCheckBackgroundService> _logger;

    public SubscriptionCheckBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<SubscriptionCheckBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SaaS Do'konlar obunasini avtomatik monitoring qilish xizmati ishga tushdi.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var now = DateTime.UtcNow;
                var expiredStores = await db.Stores
                    .Where(s => s.IsActive && s.SubscriptionExpiresAt.HasValue && s.SubscriptionExpiresAt.Value < now)
                    .ToListAsync(stoppingToken);

                if (expiredStores.Count > 0)
                {
                    foreach (var store in expiredStores)
                    {
                        store.IsActive = false;
                        store.UpdatedAt = now;
                        _logger.LogWarning("SIM-karta kabi avtomatik o'chirildi (obuna tugadi): {StoreName} (ID: {StoreId})", store.Name, store.Id);
                    }

                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Do'konlar obuna muddatini tekshirishda xatolik yuz berdi");
            }

            // Har 5 daqiqada bir marta tekshirib turadi
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
