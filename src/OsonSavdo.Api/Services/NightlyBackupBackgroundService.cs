using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Services;

public class NightlyBackupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NightlyBackupBackgroundService> _logger;

    public NightlyBackupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<NightlyBackupBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Tungi avtomatik baza zaxirasi (Nightly Backup) xizmati ishga tushdi.");

        // Boshlanishida bir oz kutamiz (server to'liq ochilishi uchun)
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.Now;
                // Har kecha soat 23:30 da zaxira olish
                var nextRun = now.Date.AddHours(23).AddMinutes(30);
                if (now > nextRun)
                {
                    nextRun = nextRun.AddDays(1);
                }

                var delay = nextRun - now;
                _logger.LogInformation("Keyingi tungi zaxira vaqti: {NextRun} (kutish: {Hours:F1} soat)", nextRun, delay.TotalHours);

                await Task.Delay(delay, stoppingToken);

                _logger.LogInformation("Tungi zaxira nusxasi yaratilmoqda va Telegramga jo'natilmoqda...");

                using var scope = _serviceProvider.CreateScope();
                var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();
                await backupService.SendBackupToTelegramAsync(null, stoppingToken);

                _logger.LogInformation("Tungi zaxira nusxasi muvaffaqiyatli jo'natildi.");
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tungi avtomatik zaxira xizmatida xatolik yuz berdi.");
                // Xatolik bo'lsa 30 daqiqa kutib qayta urinish
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }
    }
}

