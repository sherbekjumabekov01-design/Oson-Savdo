namespace OsonSavdo.Application.Interfaces;

public interface IBackupService
{
    Task<byte[]> CreateDatabaseBackupZipAsync(CancellationToken ct = default);
    Task<bool> SendBackupToTelegramAsync(int? storeId = null, CancellationToken ct = default);
}

