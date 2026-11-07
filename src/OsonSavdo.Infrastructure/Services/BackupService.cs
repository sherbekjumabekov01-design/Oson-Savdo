using System.IO.Compression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Infrastructure.Data;

namespace OsonSavdo.Infrastructure.Services;

public class BackupService : IBackupService
{
    private readonly AppDbContext _db;
    private readonly ITelegramService _telegramService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BackupService> _logger;

    public BackupService(
        AppDbContext db,
        ITelegramService telegramService,
        IConfiguration configuration,
        ILogger<BackupService> logger)
    {
        _db = db;
        _telegramService = telegramService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<byte[]> CreateDatabaseBackupZipAsync(CancellationToken ct = default)
    {
        var provider = _configuration["DatabaseProvider"] ?? "Sqlite";
        var tempSnapshotPath = Path.Combine(Path.GetTempPath(), $"osonsavdo_snap_{Guid.NewGuid():N}.db");

        try
        {
            if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                // SQLite VACUUM INTO buyrug'i bazani xavfsiz va to'liq snapshot qiladi
                try
                {
                    // Fayl yo'lidagi teskari chiziqlarni SQLite to'g'ri tushunishi uchun forward slash qilamiz
                    var cleanTempPath = tempSnapshotPath.Replace("\\", "/");
#pragma warning disable EF1002
                    await _db.Database.ExecuteSqlRawAsync($"VACUUM INTO '{cleanTempPath}'", ct);
#pragma warning restore EF1002
                }
                catch (Exception vacuumEx)
                {
                    _logger.LogWarning(vacuumEx, "VACUUM INTO bajarilmadi, to'g'ridan-to'g'ri fayldan nusxa olishga urinilmoqda.");
                    var dbFileName = "osonsavdo.db";
                    if (File.Exists(dbFileName))
                    {
                        File.Copy(dbFileName, tempSnapshotPath, true);
                    }
                    else
                    {
                        throw;
                    }
                }

                // Snapshotni ZIP arxiviga siqamiz
                using var memoryStream = new MemoryStream();
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    var entryName = $"osonsavdo_backup_{DateTime.Now:yyyyMMdd_HHmmss}.db";
                    var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);

                    using var entryStream = entry.Open();
                    using var fileStream = File.OpenRead(tempSnapshotPath);
                    await fileStream.CopyToAsync(entryStream, ct);
                }

                return memoryStream.ToArray();
            }
            else
            {
                throw new NotSupportedException($"Faqat SQLite provayderi uchun avtomatik zaxira qo'llab-quvvatlanadi (Hozirgi: {provider})");
            }
        }
        finally
        {
            if (File.Exists(tempSnapshotPath))
            {
                try
                {
                    File.Delete(tempSnapshotPath);
                }
                catch (Exception delEx)
                {
                    _logger.LogWarning(delEx, "Vaqtinchalik snapshot faylini o'chirishda xatolik: {Path}", tempSnapshotPath);
                }
            }
        }
    }

    public async Task<bool> SendBackupToTelegramAsync(int? storeId = null, CancellationToken ct = default)
    {
        try
        {
            var zipBytes = await CreateDatabaseBackupZipAsync(ct);
            var fileName = $"OsonSavdo_Backup_{DateTime.Now:yyyy_MM_dd_HHmm}.zip";

            var storesQuery = _db.Stores.AsNoTracking().Where(s => s.IsActive && s.TelegramNotificationsEnabled);
            if (storeId.HasValue && storeId.Value > 0)
            {
                storesQuery = storesQuery.Where(s => s.Id == storeId.Value);
            }

            var stores = await storesQuery.ToListAsync(ct);
            if (stores.Count == 0)
            {
                _logger.LogInformation("Zaxira nusxani Telegramga yuborish uchun faol do'kon topilmadi.");
                return false;
            }

            bool anySuccess = false;
            foreach (var store in stores)
            {
                if (string.IsNullOrWhiteSpace(store.TelegramBotToken) || string.IsNullOrWhiteSpace(store.TelegramChatId))
                    continue;

                var caption = $"💾 <b>OSON SAVDO - BAZA ZAXIRA NUSXASI (BACKUP)</b>\n" +
                              $"🏪 <b>Do'kon:</b> {store.Name}\n" +
                              $"📅 <b>Sana va vaqt:</b> {DateTime.Now:dd.MM.yyyy HH:mm}\n" +
                              $"📦 <b>Hajmi:</b> {zipBytes.Length / 1024.0:F1} KB\n" +
                              $"✅ <i>Tizim ma'lumotlar bazasi xavfsiz saqlandi.</i>";

                var sent = await _telegramService.SendDocumentAsync(
                    store.TelegramBotToken,
                    store.TelegramChatId,
                    zipBytes,
                    fileName,
                    caption,
                    ct);

                if (sent) anySuccess = true;
            }

            return anySuccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegramga zaxira nusxasini yuborishda xatolik.");
            return false;
        }
    }
}

