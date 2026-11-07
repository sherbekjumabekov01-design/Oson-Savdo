namespace OsonSavdo.Application.DTOs;

public record StoreResponseDto(
    int Id,
    string Name,
    string OwnerFullName,
    string Phone,
    string? Address,
    bool IsActive,
    DateTime? SubscriptionExpiresAt,
    decimal MonthlyFee,
    string Plan,
    DateTime CreatedAt,
    int ProductsCount,
    int UsersCount,
    int SalesCount,
    decimal TotalRevenue,
    decimal TodayRevenue,
    bool IsSubscriptionExpired,
    string? TelegramBotToken = null,
    string? TelegramChatId = null,
    bool TelegramNotificationsEnabled = true,
    decimal CashbackRate = 1.0m,
    bool EnableCashback = true,
    string ScalePrefix = "21",
    decimal UsdRate = 12850m
);

public record StoreSettingsDto(
    string? TelegramBotToken,
    string? TelegramChatId,
    bool TelegramNotificationsEnabled,
    decimal CashbackRate,
    bool EnableCashback,
    string ScalePrefix,
    decimal UsdRate = 12850m
);

public record CreateStoreDto(
    string Name,
    string OwnerFullName,
    string Phone,
    string? Address,
    decimal MonthlyFee,
    string Plan,
    int SubscriptionDays,
    string AdminUsername,
    string AdminPassword
);

public record UpdateStoreDto(
    string Name,
    string OwnerFullName,
    string Phone,
    string? Address,
    decimal MonthlyFee,
    string Plan,
    bool IsActive,
    DateTime? SubscriptionExpiresAt
);

public record ExtendSubscriptionDto(
    int Days
);

public record PlatformStatsDto(
    int TotalStores,
    int ActiveStores,
    int InactiveStores,
    int ExpiredSubscriptionStores,
    decimal TotalPlatformRevenueToday,
    int TotalPlatformSalesCountToday,
    int TotalProductsAcrossStores,
    decimal ProjectedMonthlySaaSFee
);

public record StoreOverviewDto(
    StoreResponseDto Store,
    decimal TotalSalesAmount,
    decimal TotalDebtsGiven,
    decimal TotalExpenses,
    int LowStockProductsCount
);

public record SubscriptionPaymentDto(
    int Id,
    int StoreId,
    string StoreName,
    decimal Amount,
    string PaymentMethod,
    int DaysAdded,
    DateTime PaidAt,
    string ReceiptNumber,
    string? Note
);

public record RecordPaymentDto(
    int StoreId,
    decimal Amount,
    string PaymentMethod,
    int DaysAdded,
    string? Note
);

public record ResetAdminPasswordDto(
    string NewPassword
);

public record PlatformAnnouncementDto(
    int Id,
    string Title,
    string Message,
    string Type,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? ExpiresAt
);

public record CreateAnnouncementDto(
    string Title,
    string Message,
    string Type,
    int? ActiveDays
);

public record PlanDistributionDto(
    string Plan,
    int Count,
    decimal TotalMonthlyFee
);

public record TopStoreDto(
    int Id,
    string Name,
    string OwnerFullName,
    decimal TotalSales,
    decimal TodaySales,
    int ProductsCount,
    string Plan,
    bool IsActive
);

public record MonthlyRevenueGrowthDto(
    string MonthLabel,
    decimal SaasRevenue,
    decimal StoresGmv
);

public record PlatformAnalyticsDto(
    decimal MonthlyRecurringRevenue,
    decimal AnnualRecurringRevenue,
    decimal TotalPlatformGmv,
    decimal AverageRevenuePerStore,
    int TotalStores,
    int ActiveStores,
    int ExpiredStores,
    int InactiveStores,
    List<PlanDistributionDto> PlansDistribution,
    List<TopStoreDto> TopStores,
    List<MonthlyRevenueGrowthDto> RevenueGrowth
);

public record BulkExtendSubscriptionDto(
    List<int> StoreIds,
    int Days
);

public record BulkToggleStatusDto(
    List<int> StoreIds,
    bool IsActive
);

public record BulkChangePlanDto(
    List<int> StoreIds,
    string Plan,
    decimal MonthlyFee
);

public record BroadcastTelegramDto(
    string Message,
    List<int>? StoreIds = null
);

public record BroadcastResultDto(
    int TotalStores,
    int SentCount,
    int FailedCount,
    List<string> Details
);

public record SendExpiryAlertsResultDto(
    int TotalChecked,
    int SentCount,
    int SkippedCount,
    List<string> Details
);

public record PlatformAuditLogDto(
    int Id,
    string Action,
    string PerformedBy,
    int? StoreId,
    string? StoreName,
    string Details,
    DateTime CreatedAt
);

public record SystemHealthDto(
    string DatabaseSize,
    long DatabaseSizeBytes,
    int TotalStores,
    int TotalUsers,
    int TotalProducts,
    int TotalSales,
    int TotalExpenses,
    int TotalAuditLogs,
    string ServerTimeUtc,
    string ServerTimeLocal,
    string OsVersion
);

