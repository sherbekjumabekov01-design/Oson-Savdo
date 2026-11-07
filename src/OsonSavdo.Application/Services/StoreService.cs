using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class StoreService : IStoreService
{
    private readonly IAppDbContext _db;
    private readonly ITelegramService _telegramService;

    public StoreService(IAppDbContext db, ITelegramService telegramService)
    {
        _db = db;
        _telegramService = telegramService;
    }

    public async Task<List<StoreResponseDto>> GetAllStoresAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;

        var stores = await _db.Stores
            .AsNoTracking()
            .Include(s => s.Users)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);

        var result = new List<StoreResponseDto>();

        foreach (var s in stores)
        {
            var productsCount = await _db.Products.CountAsync(p => p.StoreId == s.Id, ct);
            var sales = await _db.Sales
                .Where(x => x.StoreId == s.Id)
                .Select(x => new { x.PaidAmount, x.CreatedAt })
                .ToListAsync(ct);

            var totalRev = sales.Sum(x => x.PaidAmount);
            var todayRev = sales.Where(x => x.CreatedAt.Date == today).Sum(x => x.PaidAmount);
            var isExpired = s.SubscriptionExpiresAt.HasValue && s.SubscriptionExpiresAt.Value < now;

            result.Add(new StoreResponseDto(
                Id: s.Id,
                Name: s.Name,
                OwnerFullName: s.OwnerFullName,
                Phone: s.Phone,
                Address: s.Address,
                IsActive: s.IsActive,
                SubscriptionExpiresAt: s.SubscriptionExpiresAt,
                MonthlyFee: s.MonthlyFee,
                Plan: s.Plan,
                CreatedAt: s.CreatedAt,
                ProductsCount: productsCount,
                UsersCount: s.Users.Count,
                SalesCount: sales.Count,
                TotalRevenue: totalRev,
                TodayRevenue: todayRev,
                IsSubscriptionExpired: isExpired,
                TelegramBotToken: s.TelegramBotToken,
                TelegramChatId: s.TelegramChatId,
                TelegramNotificationsEnabled: s.TelegramNotificationsEnabled,
                CashbackRate: s.CashbackRate,
                EnableCashback: s.EnableCashback,
                ScalePrefix: s.ScalePrefix,
                UsdRate: s.UsdRate
            ));
        }

        return result;
    }

    public async Task<StoreResponseDto> GetStoreByIdAsync(int id, CancellationToken ct = default)
    {
        var s = await _db.Stores
            .AsNoTracking()
            .Include(x => x.Users)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (s == null)
            throw new NotFoundException("Do'kon topilmadi.");

        var now = DateTime.UtcNow;
        var today = now.Date;

        var productsCount = await _db.Products.CountAsync(p => p.StoreId == s.Id, ct);
        var sales = await _db.Sales
            .Where(x => x.StoreId == s.Id)
            .Select(x => new { x.PaidAmount, x.CreatedAt })
            .ToListAsync(ct);

        var totalRev = sales.Sum(x => x.PaidAmount);
        var todayRev = sales.Where(x => x.CreatedAt.Date == today).Sum(x => x.PaidAmount);
        var isExpired = s.SubscriptionExpiresAt.HasValue && s.SubscriptionExpiresAt.Value < now;

        return new StoreResponseDto(
            Id: s.Id,
            Name: s.Name,
            OwnerFullName: s.OwnerFullName,
            Phone: s.Phone,
            Address: s.Address,
            IsActive: s.IsActive,
            SubscriptionExpiresAt: s.SubscriptionExpiresAt,
            MonthlyFee: s.MonthlyFee,
            Plan: s.Plan,
            CreatedAt: s.CreatedAt,
            ProductsCount: productsCount,
            UsersCount: s.Users.Count,
            SalesCount: sales.Count,
            TotalRevenue: totalRev,
            TodayRevenue: todayRev,
            IsSubscriptionExpired: isExpired,
            TelegramBotToken: s.TelegramBotToken,
            TelegramChatId: s.TelegramChatId,
            TelegramNotificationsEnabled: s.TelegramNotificationsEnabled,
            CashbackRate: s.CashbackRate,
            EnableCashback: s.EnableCashback,
            ScalePrefix: s.ScalePrefix,
            UsdRate: s.UsdRate
        );
    }

    public async Task<StoreResponseDto> CreateStoreAsync(CreateStoreDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessException("Do'kon nomi kiritilishi shart.");

        if (string.IsNullOrWhiteSpace(dto.AdminUsername) || string.IsNullOrWhiteSpace(dto.AdminPassword))
            throw new BusinessException("Do'kon admini uchun login va parol kiritilishi shart.");

        var username = dto.AdminUsername.Trim().ToLower();
        var existsUser = await _db.Users.AnyAsync(u => u.Username.ToLower() == username, ct);
        if (existsUser)
            throw new BusinessException($"'{username}' logini allaqachon band. Boshqa login tanlang.");

        var subDays = dto.SubscriptionDays > 0 ? dto.SubscriptionDays : 30;

        var store = new Store
        {
            Name = dto.Name.Trim(),
            OwnerFullName = dto.OwnerFullName.Trim(),
            Phone = dto.Phone.Trim(),
            Address = dto.Address?.Trim(),
            MonthlyFee = dto.MonthlyFee > 0 ? dto.MonthlyFee : 150000m,
            Plan = string.IsNullOrWhiteSpace(dto.Plan) ? "Standart" : dto.Plan.Trim(),
            IsActive = true,
            SubscriptionExpiresAt = DateTime.UtcNow.AddDays(subDays),
            CreatedAt = DateTime.UtcNow
        };

        _db.Stores.Add(store);
        await _db.SaveChangesAsync(ct);

        // Do'kon admin foydalanuvchisini yaratish
        var adminUser = new User
        {
            Username = username,
            PasswordHash = AuthService.HashPassword(dto.AdminPassword),
            FullName = !string.IsNullOrWhiteSpace(dto.OwnerFullName) ? dto.OwnerFullName.Trim() : $"{store.Name} Admin",
            Role = UserRole.Admin,
            StoreId = store.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(adminUser);
        await _db.SaveChangesAsync(ct);

        await LogAuditAsync("StoreCreated", $"Yangi do'kon yaratildi: '{store.Name}' (Egasi: {store.OwnerFullName}, Tarif: {store.Plan})", store.Id, store.Name, "SuperAdmin", ct);

        return await GetStoreByIdAsync(store.Id, ct);
    }

    public async Task<StoreResponseDto> UpdateStoreAsync(int id, UpdateStoreDto dto, CancellationToken ct = default)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (store == null)
            throw new NotFoundException("Do'kon topilmadi.");

        store.Name = dto.Name.Trim();
        store.OwnerFullName = dto.OwnerFullName.Trim();
        store.Phone = dto.Phone.Trim();
        store.Address = dto.Address?.Trim();
        store.MonthlyFee = dto.MonthlyFee;
        store.Plan = dto.Plan;
        store.IsActive = dto.IsActive;
        store.SubscriptionExpiresAt = dto.SubscriptionExpiresAt;
        store.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("StoreUpdated", $"Do'kon tahrirlandi: '{store.Name}' (Tarif: {store.Plan}, Oylik: {store.MonthlyFee:N0} so'm)", store.Id, store.Name, "SuperAdmin", ct);

        return await GetStoreByIdAsync(store.Id, ct);
    }

    public async Task<bool> ToggleStoreStatusAsync(int id, CancellationToken ct = default)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (store == null)
            throw new NotFoundException("Do'kon topilmadi.");

        store.IsActive = !store.IsActive;
        store.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await LogAuditAsync("StoreStatusToggled", $"Do'kon holati o'zgartirildi: '{store.Name}' -> {(store.IsActive ? "Faol" : "Bloklangan")}", store.Id, store.Name, "SuperAdmin", ct);

        return store.IsActive;
    }

    public async Task<StoreResponseDto> ExtendSubscriptionAsync(int id, int days, CancellationToken ct = default)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (store == null)
            throw new NotFoundException("Do'kon topilmadi.");

        var daysToAdd = days > 0 ? days : 30;
        var now = DateTime.UtcNow;

        if (!store.SubscriptionExpiresAt.HasValue || store.SubscriptionExpiresAt.Value < now)
        {
            store.SubscriptionExpiresAt = now.AddDays(daysToAdd);
        }
        else
        {
            store.SubscriptionExpiresAt = store.SubscriptionExpiresAt.Value.AddDays(daysToAdd);
        }

        store.IsActive = true;
        store.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("SubscriptionExtended", $"Obuna uzaytirildi: '{store.Name}' +{daysToAdd} kun (Yangi muddat: {store.SubscriptionExpiresAt:yyyy-MM-dd})", store.Id, store.Name, "SuperAdmin", ct);

        return await GetStoreByIdAsync(store.Id, ct);
    }

    public async Task<PlatformStatsDto> GetPlatformStatsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;

        var stores = await _db.Stores.AsNoTracking().ToListAsync(ct);
        var totalStores = stores.Count;
        var activeStores = stores.Count(s => s.IsActive);
        var inactiveStores = stores.Count(s => !s.IsActive);
        var expiredStores = stores.Count(s => s.SubscriptionExpiresAt.HasValue && s.SubscriptionExpiresAt.Value < now);

        var todaySales = await _db.Sales
            .Where(s => s.CreatedAt.Date == today)
            .Select(s => s.PaidAmount)
            .ToListAsync(ct);

        var totalRevToday = todaySales.Sum();
        var salesCountToday = todaySales.Count;
        var totalProducts = await _db.Products.CountAsync(ct);
        var projectedMonthlyFee = stores.Where(s => s.IsActive).Sum(s => s.MonthlyFee);

        return new PlatformStatsDto(
            TotalStores: totalStores,
            ActiveStores: activeStores,
            InactiveStores: inactiveStores,
            ExpiredSubscriptionStores: expiredStores,
            TotalPlatformRevenueToday: totalRevToday,
            TotalPlatformSalesCountToday: salesCountToday,
            TotalProductsAcrossStores: totalProducts,
            ProjectedMonthlySaaSFee: projectedMonthlyFee
        );
    }

    public async Task<StoreOverviewDto> GetStoreOverviewAsync(int id, CancellationToken ct = default)
    {
        var storeDto = await GetStoreByIdAsync(id, ct);

        var totalSales = await _db.Sales
            .Where(s => s.StoreId == id)
            .SumAsync(s => s.TotalAmount, ct);

        var totalDebts = await _db.Customers
            .Where(c => c.StoreId == id)
            .SumAsync(c => c.TotalDebt, ct);

        var totalExpenses = await _db.Expenses
            .Where(e => e.StoreId == id)
            .SumAsync(e => e.Amount, ct);

        var lowStock = await _db.Products
            .Where(p => p.StoreId == id && p.StockQuantity <= p.MinStockAlert)
            .CountAsync(ct);

        return new StoreOverviewDto(
            Store: storeDto,
            TotalSalesAmount: totalSales,
            TotalDebtsGiven: totalDebts,
            TotalExpenses: totalExpenses,
            LowStockProductsCount: lowStock
        );
    }

    public async Task<StoreResponseDto> UpdateStoreSettingsAsync(int id, StoreSettingsDto dto, CancellationToken ct = default)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (store == null)
            throw new NotFoundException("Do'kon topilmadi.");

        store.TelegramBotToken = dto.TelegramBotToken?.Trim();
        store.TelegramChatId = dto.TelegramChatId?.Trim();
        store.TelegramNotificationsEnabled = dto.TelegramNotificationsEnabled;
        store.CashbackRate = dto.CashbackRate >= 0 ? dto.CashbackRate : 1.0m;
        store.EnableCashback = dto.EnableCashback;
        store.ScalePrefix = !string.IsNullOrWhiteSpace(dto.ScalePrefix) ? dto.ScalePrefix.Trim() : "21";

        var oldUsdRate = store.UsdRate;
        if (dto.UsdRate > 0)
        {
            store.UsdRate = dto.UsdRate;
            // Agar dollar kursi o'zgargan bo'lsa, barcha dollarga bog'langan tovarlar narxini avtomatik yangilash
            if (oldUsdRate != dto.UsdRate)
            {
                var usdProducts = await _db.Products.Where(p => p.StoreId == id && p.IsUsdPrice).ToListAsync(ct);
                foreach (var p in usdProducts)
                {
                    if (p.SellingPriceUsd > 0)
                        p.SellingPrice = Math.Round(p.SellingPriceUsd * dto.UsdRate, 0);
                    if (p.CostPriceUsd > 0)
                        p.CostPrice = Math.Round(p.CostPriceUsd * dto.UsdRate, 0);
                    p.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        store.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return await GetStoreByIdAsync(id, ct);
    }

    public async Task<bool> DeleteStoreAsync(int id, CancellationToken ct = default)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (store == null)
            throw new NotFoundException("Do'kon topilmadi.");

        // Do'konga tegishli foydalanuvchilar va ma'lumotlarni tozalash
        var users = await _db.Users.Where(u => u.StoreId == id).ToListAsync(ct);
        _db.Users.RemoveRange(users);

        _db.Stores.Remove(store);
        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("StoreDeleted", $"Do'kon o'chirildi: '{store.Name}' (ID: {store.Id})", store.Id, store.Name, "SuperAdmin", ct);
        return true;
    }

    public async Task<bool> ResetAdminPasswordAsync(int storeId, string newPassword, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 4)
            throw new BusinessException("Parol kamida 4 ta belgidan iborat bo'lishi kerak.");

        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId, ct);
        if (store == null)
            throw new NotFoundException("Do'kon topilmadi.");

        var adminUser = await _db.Users
            .FirstOrDefaultAsync(u => u.StoreId == storeId && u.Role == UserRole.Admin, ct);

        if (adminUser == null)
        {
            // Agar admin foydalanuvchi topilmasa, yaratamiz
            adminUser = new User
            {
                Username = $"admin_{storeId}",
                PasswordHash = AuthService.HashPassword(newPassword.Trim()),
                FullName = store.OwnerFullName,
                Role = UserRole.Admin,
                IsActive = true,
                StoreId = storeId,
                CreatedAt = DateTime.UtcNow
            };
            _db.Users.Add(adminUser);
        }
        else
        {
            adminUser.PasswordHash = AuthService.HashPassword(newPassword.Trim());
        }

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("AdminPasswordReset", $"Admin paroli yangilandi: '{store.Name}' (Username: {adminUser.Username})", store.Id, store.Name, "SuperAdmin", ct);
        return true;
    }

    public async Task<List<SubscriptionPaymentDto>> GetSubscriptionPaymentsAsync(CancellationToken ct = default)
    {
        var payments = await _db.SubscriptionPayments
            .AsNoTracking()
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync(ct);

        return payments.Select(p => new SubscriptionPaymentDto(
            Id: p.Id,
            StoreId: p.StoreId,
            StoreName: p.StoreName,
            Amount: p.Amount,
            PaymentMethod: p.PaymentMethod,
            DaysAdded: p.DaysAdded,
            PaidAt: p.PaidAt,
            ReceiptNumber: p.ReceiptNumber,
            Note: p.Note
        )).ToList();
    }

    public async Task<SubscriptionPaymentDto> RecordSubscriptionPaymentAsync(RecordPaymentDto dto, CancellationToken ct = default)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == dto.StoreId, ct);
        if (store == null)
            throw new NotFoundException("Do'kon topilmadi.");

        var now = DateTime.UtcNow;
        var currentExpiry = store.SubscriptionExpiresAt.HasValue && store.SubscriptionExpiresAt.Value > now
            ? store.SubscriptionExpiresAt.Value
            : now;

        store.SubscriptionExpiresAt = currentExpiry.AddDays(dto.DaysAdded > 0 ? dto.DaysAdded : 30);
        store.IsActive = true;
        store.UpdatedAt = now;

        var receiptNum = $"INV-{now:yyyyMMdd}-{new Random().Next(1000, 9999)}";
        var payment = new SubscriptionPayment
        {
            StoreId = store.Id,
            StoreName = store.Name,
            Amount = dto.Amount > 0 ? dto.Amount : store.MonthlyFee,
            PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "Naqd" : dto.PaymentMethod,
            DaysAdded = dto.DaysAdded > 0 ? dto.DaysAdded : 30,
            PaidAt = now,
            ReceiptNumber = receiptNum,
            Note = dto.Note
        };

        _db.SubscriptionPayments.Add(payment);
        await _db.SaveChangesAsync(ct);

        await LogAuditAsync("PaymentRecorded", $"Obuna to'lovi qabul qilindi: '{store.Name}' - {payment.Amount:N0} so'm ({payment.PaymentMethod}, Kvitansiya: {payment.ReceiptNumber}, +{payment.DaysAdded} kun)", store.Id, store.Name, "SuperAdmin", ct);

        return new SubscriptionPaymentDto(
            Id: payment.Id,
            StoreId: payment.StoreId,
            StoreName: payment.StoreName,
            Amount: payment.Amount,
            PaymentMethod: payment.PaymentMethod,
            DaysAdded: payment.DaysAdded,
            PaidAt: payment.PaidAt,
            ReceiptNumber: payment.ReceiptNumber,
            Note: payment.Note
        );
    }

    public async Task<PlatformAnalyticsDto> GetPlatformAnalyticsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var stores = await _db.Stores
            .AsNoTracking()
            .ToListAsync(ct);

        var totalStores = stores.Count;
        var activeStores = stores.Count(s => s.IsActive && (!s.SubscriptionExpiresAt.HasValue || s.SubscriptionExpiresAt.Value >= now));
        var expiredStores = stores.Count(s => s.SubscriptionExpiresAt.HasValue && s.SubscriptionExpiresAt.Value < now);
        var inactiveStores = stores.Count(s => !s.IsActive);

        var mrr = stores.Where(s => s.IsActive).Sum(s => s.MonthlyFee);
        var arr = mrr * 12m;
        var arpu = activeStores > 0 ? Math.Round(mrr / activeStores, 0) : 0m;

        var totalGmv = await _db.Sales.SumAsync(s => s.PaidAmount, ct);

        // Plans distribution
        var plans = stores
            .GroupBy(s => string.IsNullOrWhiteSpace(s.Plan) ? "Standart" : s.Plan)
            .Select(g => new PlanDistributionDto(
                Plan: g.Key,
                Count: g.Count(),
                TotalMonthlyFee: g.Sum(x => x.MonthlyFee)
            ))
            .ToList();

        // Top stores
        var topStoreList = new List<TopStoreDto>();
        foreach (var s in stores.Take(10))
        {
            var sales = await _db.Sales
                .Where(x => x.StoreId == s.Id)
                .Select(x => new { x.PaidAmount, x.CreatedAt })
                .ToListAsync(ct);

            var totalSales = sales.Sum(x => x.PaidAmount);
            var todaySales = sales.Where(x => x.CreatedAt.Date == now.Date).Sum(x => x.PaidAmount);
            var prodCount = await _db.Products.CountAsync(p => p.StoreId == s.Id, ct);

            topStoreList.Add(new TopStoreDto(
                Id: s.Id,
                Name: s.Name,
                OwnerFullName: s.OwnerFullName,
                TotalSales: totalSales,
                TodaySales: todaySales,
                ProductsCount: prodCount,
                Plan: s.Plan,
                IsActive: s.IsActive
            ));
        }

        topStoreList = topStoreList.OrderByDescending(t => t.TotalSales).Take(5).ToList();

        // Revenue growth simulation (last 6 months)
        var growth = new List<MonthlyRevenueGrowthDto>();
        for (int i = 5; i >= 0; i--)
        {
            var monthDate = now.AddMonths(-i);
            var monthLabel = monthDate.ToString("yyyy-MM");
            var monthStoresCount = stores.Count(s => s.CreatedAt <= monthDate.AddMonths(1));
            var projectedSaas = monthStoresCount * 150000m;
            var simulatedGmv = totalGmv * (decimal)(0.5 + (0.5 * (6 - i) / 6.0));

            growth.Add(new MonthlyRevenueGrowthDto(
                MonthLabel: monthDate.ToString("MMM yyyy"),
                SaasRevenue: projectedSaas,
                StoresGmv: Math.Round(simulatedGmv, 0)
            ));
        }

        return new PlatformAnalyticsDto(
            MonthlyRecurringRevenue: mrr,
            AnnualRecurringRevenue: arr,
            TotalPlatformGmv: totalGmv,
            AverageRevenuePerStore: arpu,
            TotalStores: totalStores,
            ActiveStores: activeStores,
            ExpiredStores: expiredStores,
            InactiveStores: inactiveStores,
            PlansDistribution: plans,
            TopStores: topStoreList,
            RevenueGrowth: growth
        );
    }

    public async Task<List<PlatformAnnouncementDto>> GetAnnouncementsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var announcements = await _db.PlatformAnnouncements
            .AsNoTracking()
            .Where(a => a.IsActive && (!a.ExpiresAt.HasValue || a.ExpiresAt.Value >= now))
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

        return announcements.Select(a => new PlatformAnnouncementDto(
            Id: a.Id,
            Title: a.Title,
            Message: a.Message,
            Type: a.Type,
            IsActive: a.IsActive,
            CreatedAt: a.CreatedAt,
            ExpiresAt: a.ExpiresAt
        )).ToList();
    }

    public async Task<PlatformAnnouncementDto> CreateAnnouncementAsync(CreateAnnouncementDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
            throw new BusinessException("E'lon sarlavhasi va matni kiritilishi shart.");

        var announcement = new PlatformAnnouncement
        {
            Title = dto.Title.Trim(),
            Message = dto.Message.Trim(),
            Type = string.IsNullOrWhiteSpace(dto.Type) ? "info" : dto.Type,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = dto.ActiveDays.HasValue && dto.ActiveDays.Value > 0
                ? DateTime.UtcNow.AddDays(dto.ActiveDays.Value)
                : null
        };

        _db.PlatformAnnouncements.Add(announcement);
        await _db.SaveChangesAsync(ct);

        return new PlatformAnnouncementDto(
            Id: announcement.Id,
            Title: announcement.Title,
            Message: announcement.Message,
            Type: announcement.Type,
            IsActive: announcement.IsActive,
            CreatedAt: announcement.CreatedAt,
            ExpiresAt: announcement.ExpiresAt
        );
    }

    public async Task<bool> DeleteAnnouncementAsync(int id, CancellationToken ct = default)
    {
        var item = await _db.PlatformAnnouncements.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (item != null)
        {
            _db.PlatformAnnouncements.Remove(item);
            await _db.SaveChangesAsync(ct);
        }
        return true;
    }

    public async Task<byte[]> ExportStoresCsvAsync(CancellationToken ct = default)
    {
        var stores = await GetAllStoresAsync(ct);

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("ID,Do'kon Nomi,Egasi,Telefon,Manzil,Tarif,Oylik To'lov (so'm),Holat,Obuna Tugash Sanasi,Jami Savdolar (so'm),Bugungi Savdo (so'm),Mahsulotlar Soni,Xodimlar Soni,Yaratilgan Sana");

        foreach (var s in stores)
        {
            var status = s.IsSubscriptionExpired ? "Obuna tugagan" : s.IsActive ? "Faol" : "Nofaol";
            var expiry = s.SubscriptionExpiresAt?.ToString("yyyy-MM-dd") ?? "Belgilanmagan";
            var created = s.CreatedAt.ToString("yyyy-MM-dd");

            sb.AppendLine($"\"{s.Id}\",\"{s.Name.Replace("\"", "\"\"")}\",\"{s.OwnerFullName.Replace("\"", "\"\"")}\",\"{s.Phone}\",\"{s.Address?.Replace("\"", "\"\"")}\",\"{s.Plan}\",\"{s.MonthlyFee}\",\"{status}\",\"{expiry}\",\"{s.TotalRevenue}\",\"{s.TodayRevenue}\",\"{s.ProductsCount}\",\"{s.UsersCount}\",\"{created}\"");
        }

        var preamble = System.Text.Encoding.UTF8.GetPreamble();
        var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[preamble.Length + bytes.Length];
        Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
        Buffer.BlockCopy(bytes, 0, result, preamble.Length, bytes.Length);

        return result;
    }

    public async Task<int> BulkExtendSubscriptionAsync(BulkExtendSubscriptionDto dto, CancellationToken ct = default)
    {
        if (dto.StoreIds == null || dto.StoreIds.Count == 0)
            return 0;

        var daysToAdd = dto.Days > 0 ? dto.Days : 30;
        var now = DateTime.UtcNow;

        var stores = await _db.Stores
            .Where(s => dto.StoreIds.Contains(s.Id))
            .ToListAsync(ct);

        foreach (var store in stores)
        {
            if (!store.SubscriptionExpiresAt.HasValue || store.SubscriptionExpiresAt.Value < now)
                store.SubscriptionExpiresAt = now.AddDays(daysToAdd);
            else
                store.SubscriptionExpiresAt = store.SubscriptionExpiresAt.Value.AddDays(daysToAdd);

            store.IsActive = true;
            store.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("BulkExtendSubscription", $"{stores.Count} ta do'kon obunasi +{daysToAdd} kunga uzaytirildi: {string.Join(", ", stores.Select(s => s.Name))}", null, null, "SuperAdmin", ct);

        return stores.Count;
    }

    public async Task<int> BulkToggleStatusAsync(BulkToggleStatusDto dto, CancellationToken ct = default)
    {
        if (dto.StoreIds == null || dto.StoreIds.Count == 0)
            return 0;

        var now = DateTime.UtcNow;
        var stores = await _db.Stores
            .Where(s => dto.StoreIds.Contains(s.Id))
            .ToListAsync(ct);

        foreach (var store in stores)
        {
            store.IsActive = dto.IsActive;
            store.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);
        var statusText = dto.IsActive ? "faollashtirildi" : "to'xtatildi (bloklandi)";
        await LogAuditAsync("BulkToggleStatus", $"{stores.Count} ta do'kon holati {statusText}: {string.Join(", ", stores.Select(s => s.Name))}", null, null, "SuperAdmin", ct);

        return stores.Count;
    }

    public async Task<int> BulkChangePlanAsync(BulkChangePlanDto dto, CancellationToken ct = default)
    {
        if (dto.StoreIds == null || dto.StoreIds.Count == 0)
            return 0;

        var now = DateTime.UtcNow;
        var planName = string.IsNullOrWhiteSpace(dto.Plan) ? "Standart" : dto.Plan.Trim();

        var stores = await _db.Stores
            .Where(s => dto.StoreIds.Contains(s.Id))
            .ToListAsync(ct);

        foreach (var store in stores)
        {
            store.Plan = planName;
            if (dto.MonthlyFee > 0)
                store.MonthlyFee = dto.MonthlyFee;
            store.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("BulkChangePlan", $"{stores.Count} ta do'kon tarifi '{planName}' ga o'tkazildi (Oylik stavka: {dto.MonthlyFee:N0} so'm): {string.Join(", ", stores.Select(s => s.Name))}", null, null, "SuperAdmin", ct);

        return stores.Count;
    }

    public async Task<BroadcastResultDto> BroadcastTelegramAsync(BroadcastTelegramDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
            throw new BusinessException("Xabarnoma matni kiritilishi shart.");

        var query = _db.Stores.AsQueryable();
        if (dto.StoreIds != null && dto.StoreIds.Count > 0)
            query = query.Where(s => dto.StoreIds.Contains(s.Id));

        var targetStores = await query.ToListAsync(ct);
        int sent = 0;
        int failed = 0;
        var details = new List<string>();

        var formattedMsg = $"📢 <b>OSON SAVDO - TIZIM XABARNOMASI</b>\n" +
                           $"━━━━━━━━━━━━━━━━━━━━\n" +
                           $"{dto.Message.Trim()}\n" +
                           $"━━━━━━━━━━━━━━━━━━━━\n" +
                           $"🏢 <i>Platforma Ma'muriyati</i> • 🕒 <i>{DateTime.UtcNow.AddHours(5):yyyy-MM-dd HH:mm}</i>";

        foreach (var store in targetStores)
        {
            if (string.IsNullOrWhiteSpace(store.TelegramBotToken) || string.IsNullOrWhiteSpace(store.TelegramChatId))
            {
                failed++;
                details.Add($"{store.Name}: Bot token yoki Chat ID sozlanmagan");
                continue;
            }

            try
            {
                var ok = await _telegramService.SendMessageAsync(store.TelegramBotToken, store.TelegramChatId, formattedMsg, ct);
                if (ok)
                {
                    sent++;
                    details.Add($"{store.Name}: Yetkazildi ✅");
                }
                else
                {
                    failed++;
                    details.Add($"{store.Name}: Yuborishda xatolik ❌");
                }
            }
            catch (Exception ex)
            {
                failed++;
                details.Add($"{store.Name}: Xato ({ex.Message})");
            }
        }

        await LogAuditAsync("BroadcastTelegram", $"{sent} ta do'konga Telegram xabarnoma yuborildi ({failed} ta yetib bormadi). Xabar: \"{(dto.Message.Length > 60 ? dto.Message.Substring(0, 60) + "..." : dto.Message)}\"", null, null, "SuperAdmin", ct);

        return new BroadcastResultDto(
            TotalStores: targetStores.Count,
            SentCount: sent,
            FailedCount: failed,
            Details: details
        );
    }

    public async Task<SendExpiryAlertsResultDto> SendSubscriptionExpiryAlertsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var warningThreshold = now.AddDays(3);

        // Obunasi 3 kun ichida tugaydigan yoki allaqachon muddati o'tgan do'konlar
        var candidateStores = await _db.Stores
            .Where(s => s.SubscriptionExpiresAt.HasValue && s.SubscriptionExpiresAt.Value <= warningThreshold)
            .ToListAsync(ct);

        int sent = 0;
        int skipped = 0;
        var details = new List<string>();

        foreach (var store in candidateStores)
        {
            if (!store.SubscriptionExpiresAt.HasValue)
                continue;

            if (string.IsNullOrWhiteSpace(store.TelegramBotToken) || string.IsNullOrWhiteSpace(store.TelegramChatId))
            {
                skipped++;
                details.Add($"{store.Name}: Telegram bot ulanmagan");
                continue;
            }

            var isExpired = store.SubscriptionExpiresAt.Value < now;
            var diff = store.SubscriptionExpiresAt.Value - now;
            var daysLeft = Math.Max(0, (int)Math.Ceiling(diff.TotalDays));

            string msg;
            if (isExpired)
            {
                msg = $"⚠️ <b>OSON SAVDO - OBUNA MUDDATI TUGADI!</b>\n" +
                      $"━━━━━━━━━━━━━━━━━━━━\n" +
                      $"🏪 <b>Do'kon:</b> {store.Name}\n" +
                      $"👤 <b>Egasi:</b> {store.OwnerFullName}\n" +
                      $"📅 <b>Tugagan sana:</b> {store.SubscriptionExpiresAt.Value.AddHours(5):yyyy-MM-dd}\n\n" +
                      $"Xizmatdan to'liq va uzluksiz foydalanish uchun obunani yangilashingizni so'raymiz.\n" +
                      $"Oylik to'lov stavkasi: <b>{store.MonthlyFee:N0} so'm</b>\n" +
                      $"━━━━━━━━━━━━━━━━━━━━\n" +
                      $"📞 <i>Oson Savdo Qo'llab-quvvatlash markazi</i>";
            }
            else
            {
                msg = $"⏳ <b>OSON SAVDO - OBUNA MUDDATI ESLATMASI</b>\n" +
                      $"━━━━━━━━━━━━━━━━━━━━\n" +
                      $"🏪 <b>Do'kon:</b> {store.Name}\n" +
                      $"👤 <b>Egasi:</b> {store.OwnerFullName}\n" +
                      $"⚠️ <b>Qolgan vaqt:</b> {daysLeft} kun\n" +
                      $"📅 <b>Tugash sanasi:</b> {store.SubscriptionExpiresAt.Value.AddHours(5):yyyy-MM-dd}\n\n" +
                      $"Iltimos, do'kon savdosi to'xtab qolmasligi uchun obunani o'z vaqtida uzaytiring.\n" +
                      $"━━━━━━━━━━━━━━━━━━━━\n" +
                      $"📞 <i>Oson Savdo Qo'llab-quvvatlash markazi</i>";
            }

            try
            {
                var ok = await _telegramService.SendMessageAsync(store.TelegramBotToken, store.TelegramChatId, msg, ct);
                if (ok)
                {
                    sent++;
                    details.Add($"{store.Name}: Eslatma yuborildi ({daysLeft} kun qoldi) ✅");
                }
                else
                {
                    skipped++;
                    details.Add($"{store.Name}: Telegram xatolik berdi ❌");
                }
            }
            catch (Exception ex)
            {
                skipped++;
                details.Add($"{store.Name}: Xato ({ex.Message})");
            }
        }

        await LogAuditAsync("SendExpiryAlerts", $"Obuna eslatmalari yuborildi. Nomzod do'konlar: {candidateStores.Count}, Yetkazildi: {sent}, O'tkazib yuborildi: {skipped}", null, null, "SuperAdmin", ct);

        return new SendExpiryAlertsResultDto(
            TotalChecked: candidateStores.Count,
            SentCount: sent,
            SkippedCount: skipped,
            Details: details
        );
    }

    public async Task<List<PlatformAuditLogDto>> GetPlatformAuditLogsAsync(int limit = 50, CancellationToken ct = default)
    {
        var logs = await _db.PlatformAuditLogs
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);

        return logs.Select(l => new PlatformAuditLogDto(
            Id: l.Id,
            Action: l.Action,
            PerformedBy: l.PerformedBy,
            StoreId: l.StoreId,
            StoreName: l.StoreName,
            Details: l.Details,
            CreatedAt: l.CreatedAt
        )).ToList();
    }

    public async Task<SystemHealthDto> GetSystemHealthAsync(CancellationToken ct = default)
    {
        var nowUtc = DateTime.UtcNow;
        var nowLocal = nowUtc.AddHours(5);

        var dbPath = Path.Combine(AppContext.BaseDirectory, "osonsavdo.db");
        if (!File.Exists(dbPath))
            dbPath = Path.Combine(Directory.GetCurrentDirectory(), "osonsavdo.db");

        long dbSize = 0;
        string formattedDbSize = "0 MB";
        if (File.Exists(dbPath))
        {
            var fi = new FileInfo(dbPath);
            dbSize = fi.Length;
            formattedDbSize = $"{Math.Round(dbSize / (1024.0 * 1024.0), 2)} MB";
        }

        var totalStores = await _db.Stores.CountAsync(ct);
        var totalUsers = await _db.Users.CountAsync(ct);
        var totalProducts = await _db.Products.CountAsync(ct);
        var totalSales = await _db.Sales.CountAsync(ct);
        var totalExpenses = await _db.Expenses.CountAsync(ct);
        var totalAuditLogs = await _db.PlatformAuditLogs.CountAsync(ct);

        return new SystemHealthDto(
            DatabaseSize: formattedDbSize,
            DatabaseSizeBytes: dbSize,
            TotalStores: totalStores,
            TotalUsers: totalUsers,
            TotalProducts: totalProducts,
            TotalSales: totalSales,
            TotalExpenses: totalExpenses,
            TotalAuditLogs: totalAuditLogs,
            ServerTimeUtc: nowUtc.ToString("yyyy-MM-dd HH:mm:ss 'UTC'"),
            ServerTimeLocal: nowLocal.ToString("yyyy-MM-dd HH:mm:ss 'UZT (UTC+5)'"),
            OsVersion: System.Runtime.InteropServices.RuntimeInformation.OSDescription
        );
    }

    public async Task LogAuditAsync(string action, string details, int? storeId = null, string? storeName = null, string performedBy = "SuperAdmin", CancellationToken ct = default)
    {
        try
        {
            var log = new PlatformAuditLog
            {
                Action = action,
                PerformedBy = string.IsNullOrWhiteSpace(performedBy) ? "SuperAdmin" : performedBy,
                StoreId = storeId,
                StoreName = storeName,
                Details = details,
                CreatedAt = DateTime.UtcNow
            };
            _db.PlatformAuditLogs.Add(log);
            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            // Audit log xatoligi asosiy jarayonni to'xtatmasligi kerak
        }
    }
}
