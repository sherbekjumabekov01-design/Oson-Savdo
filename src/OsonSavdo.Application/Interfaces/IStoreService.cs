using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface IStoreService
{
    Task<List<StoreResponseDto>> GetAllStoresAsync(CancellationToken ct = default);
    Task<StoreResponseDto> GetStoreByIdAsync(int id, CancellationToken ct = default);
    Task<StoreResponseDto> CreateStoreAsync(CreateStoreDto dto, CancellationToken ct = default);
    Task<StoreResponseDto> UpdateStoreAsync(int id, UpdateStoreDto dto, CancellationToken ct = default);
    Task<bool> ToggleStoreStatusAsync(int id, CancellationToken ct = default);
    Task<StoreResponseDto> ExtendSubscriptionAsync(int id, int days, CancellationToken ct = default);
    Task<PlatformStatsDto> GetPlatformStatsAsync(CancellationToken ct = default);
    Task<StoreOverviewDto> GetStoreOverviewAsync(int id, CancellationToken ct = default);
    Task<StoreResponseDto> UpdateStoreSettingsAsync(int id, StoreSettingsDto dto, CancellationToken ct = default);
    Task<bool> DeleteStoreAsync(int id, CancellationToken ct = default);
    Task<bool> ResetAdminPasswordAsync(int storeId, string newPassword, CancellationToken ct = default);
    Task<List<SubscriptionPaymentDto>> GetSubscriptionPaymentsAsync(CancellationToken ct = default);
    Task<SubscriptionPaymentDto> RecordSubscriptionPaymentAsync(RecordPaymentDto dto, CancellationToken ct = default);
    Task<PlatformAnalyticsDto> GetPlatformAnalyticsAsync(CancellationToken ct = default);
    Task<List<PlatformAnnouncementDto>> GetAnnouncementsAsync(CancellationToken ct = default);
    Task<PlatformAnnouncementDto> CreateAnnouncementAsync(CreateAnnouncementDto dto, CancellationToken ct = default);
    Task<bool> DeleteAnnouncementAsync(int id, CancellationToken ct = default);
    Task<byte[]> ExportStoresCsvAsync(CancellationToken ct = default);
    Task<int> BulkExtendSubscriptionAsync(BulkExtendSubscriptionDto dto, CancellationToken ct = default);
    Task<int> BulkToggleStatusAsync(BulkToggleStatusDto dto, CancellationToken ct = default);
    Task<int> BulkChangePlanAsync(BulkChangePlanDto dto, CancellationToken ct = default);
    Task<BroadcastResultDto> BroadcastTelegramAsync(BroadcastTelegramDto dto, CancellationToken ct = default);
    Task<SendExpiryAlertsResultDto> SendSubscriptionExpiryAlertsAsync(CancellationToken ct = default);
    Task<List<PlatformAuditLogDto>> GetPlatformAuditLogsAsync(int limit = 50, CancellationToken ct = default);
    Task<SystemHealthDto> GetSystemHealthAsync(CancellationToken ct = default);
    Task LogAuditAsync(string action, string details, int? storeId = null, string? storeName = null, string performedBy = "SuperAdmin", CancellationToken ct = default);
}
