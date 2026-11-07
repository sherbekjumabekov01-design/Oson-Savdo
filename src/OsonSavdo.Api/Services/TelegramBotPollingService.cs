using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Infrastructure.Data;

namespace OsonSavdo.Api.Services;

public class TelegramBotPollingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly HttpClient _httpClient;
    private readonly ILogger<TelegramBotPollingService> _logger;
    private readonly Dictionary<string, long> _tokenOffsets = new();

    public TelegramBotPollingService(
        IServiceProvider serviceProvider,
        HttpClient httpClient,
        ILogger<TelegramBotPollingService> logger)
    {
        _serviceProvider = serviceProvider;
        _httpClient = httpClient;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Telegram Bot interaktiv buyruqlar xizmati (Polling) ishga tushdi.");

        // Boshlang'ich kechikish
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var telegramService = scope.ServiceProvider.GetRequiredService<ITelegramService>();
                var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();

                // Telegram sozlamalari bor faol do'konlarni olamiz
                var stores = await db.Stores
                    .AsNoTracking()
                    .Where(s => s.IsActive && s.TelegramNotificationsEnabled && !string.IsNullOrEmpty(s.TelegramBotToken))
                    .ToListAsync(stoppingToken);

                var uniqueTokens = stores
                    .GroupBy(s => s.TelegramBotToken!)
                    .Select(g => new { Token = g.Key, Stores = g.ToList() })
                    .ToList();

                foreach (var group in uniqueTokens)
                {
                    if (stoppingToken.IsCancellationRequested) break;
                    await ProcessUpdatesForTokenAsync(group.Token, group.Stores, db, telegramService, backupService, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Telegram Bot Polling xatosi: {Message}", ex.Message);
            }

            // Har 4 soniyada yangi xabarlarni tekshirish
            await Task.Delay(TimeSpan.FromSeconds(4), stoppingToken);
        }
    }

    private async Task ProcessUpdatesForTokenAsync(
        string token,
        List<Store> matchingStores,
        AppDbContext db,
        ITelegramService telegramService,
        IBackupService backupService,
        CancellationToken ct)
    {
        try
        {
            _tokenOffsets.TryGetValue(token, out var currentOffset);

            var url = $"https://api.telegram.org/bot{token}/getUpdates?offset={currentOffset}&limit=10&timeout=1";
            var response = await _httpClient.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                return;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("ok", out var okProp) || !okProp.GetBoolean())
                return;

            if (!root.TryGetProperty("result", out var resultArr) || resultArr.ValueKind != JsonValueKind.Array)
                return;

            foreach (var update in resultArr.EnumerateArray())
            {
                if (update.TryGetProperty("update_id", out var updateIdProp))
                {
                    long updateId = updateIdProp.GetInt64();
                    _tokenOffsets[token] = updateId + 1;
                }

                if (!update.TryGetProperty("message", out var msg))
                    continue;

                if (!msg.TryGetProperty("chat", out var chat) || !chat.TryGetProperty("id", out var chatIdProp))
                    continue;

                string chatId = chatIdProp.ToString();
                string text = msg.TryGetProperty("text", out var textProp) ? textProp.GetString()?.Trim() ?? "" : "";

                if (string.IsNullOrWhiteSpace(text))
                    continue;

                // Xabar yuborgan chat_id qaysi do'kon egasiga tegishli ekanligini aniqlaymiz
                var store = matchingStores.FirstOrDefault(s => string.Equals(s.TelegramChatId, chatId, StringComparison.OrdinalIgnoreCase));

                await HandleCommandAsync(token, chatId, text, store, db, telegramService, backupService, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Token uchun update olishda xatolik");
        }
    }

    private async Task HandleCommandAsync(
        string token,
        string chatId,
        string text,
        Store? store,
        AppDbContext db,
        ITelegramService telegramService,
        IBackupService backupService,
        CancellationToken ct)
    {
        var command = text.Split(' ')[0].ToLowerInvariant();

        // 1. Agar foydalanuvchi do'kon egasi bo'lsa
        if (store != null)
        {
            switch (command)
            {
                case "/start":
                case "/yordam":
                case "/help":
                    var helpMsg = $"👋 <b>Assalomu alaykum, {store.OwnerFullName}!</b>\n" +
                                  $"🏪 <b>{store.Name}</b> boshqaruv botiga xush kelibsiz.\n\n" +
                                  $"📋 <b>Mavjud tezkor buyruqlar:</b>\n" +
                                  $"📊 /bugun — Bugungi savdo va sof foyda hisoboti\n" +
                                  $"🏧 /kassa — Hozirgi kassa va ochiq smena holati\n" +
                                  $"👥 /qarzlar — Nasiya qarzdorliklar va top qarzdorlar\n" +
                                  $"📦 /kamqoldi — Qoldig'i kam qolgan tovarlar\n" +
                                  $"💾 /backup — Ma'lumotlar bazasining zaxira nusxasini olish\n\n" +
                                  $"🔍 <i>Shuningdek, mijoz telefon raqamini yuborib uning qarz va keshbekini tekshirishingiz mumkin.</i>";
                    await telegramService.SendMessageAsync(token, chatId, helpMsg, ct);
                    break;

                case "/bugun":
                    await SendTodayReportAsync(token, chatId, store, db, telegramService, ct);
                    break;

                case "/kassa":
                    await SendKassaStatusAsync(token, chatId, store, db, telegramService, ct);
                    break;

                case "/qarzlar":
                    await SendDebtsReportAsync(token, chatId, store, db, telegramService, ct);
                    break;

                case "/kamqoldi":
                    await SendLowStockReportAsync(token, chatId, store, db, telegramService, ct);
                    break;

                case "/backup":
                    await telegramService.SendMessageAsync(token, chatId, "⏳ <i>Baza zaxira nusxasi tayyorlanmoqda, iltimos kuting...</i>", ct);
                    await backupService.SendBackupToTelegramAsync(store.Id, ct);
                    break;

                default:
                    // Telefon raqami qidiruvi
                    var cleanPhone = new string(text.Where(char.IsDigit).ToArray());
                    if (cleanPhone.Length >= 7)
                    {
                        await SearchCustomerByPhoneAsync(token, chatId, cleanPhone, store.Id, db, telegramService, ct);
                    }
                    else
                    {
                        await telegramService.SendMessageAsync(token, chatId, "Noma'lum buyruq. Mavjud buyruqlarni ko'rish uchun /yordam bosing.", ct);
                    }
                    break;
            }
        }
        else
        {
            // Do'kon egasi emas, lekin mijoz keshbek/qarzini tekshirishi mumkin
            var cleanPhone = new string(text.Where(char.IsDigit).ToArray());
            if (cleanPhone.Length >= 7)
            {
                var customer = await db.Customers.AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Phone.Contains(cleanPhone), ct);

                if (customer != null)
                {
                    var cMsg = $"👤 <b>Hurmatli {customer.FullName}!</b>\n" +
                               $"💳 <b>Keshbek balansingiz:</b> {customer.CashbackBalance:N0} so'm\n" +
                               $"📝 <b>Joriy qarzingiz:</b> {customer.TotalDebt:N0} so'm\n\n" +
                               $"<i>Xaridingiz uchun rahmat!</i>";
                    await telegramService.SendMessageAsync(token, chatId, cMsg, ct);
                }
                else
                {
                    await telegramService.SendMessageAsync(token, chatId, "Ushbu telefon raqami bilan mijoz topilmadi.", ct);
                }
            }
            else
            {
                await telegramService.SendMessageAsync(token, chatId,
                    "Assalomu alaykum! Oson Savdo botiga xush kelibsiz.\n" +
                    "Keshbek va qarzingizni bilish uchun telefon raqamingizni yuboring (masalan: 901234567).", ct);
            }
        }
    }

    private async Task SendTodayReportAsync(string token, string chatId, Store store, AppDbContext db, ITelegramService telegramService, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var sales = await db.Sales.AsNoTracking()
            .Include(s => s.Items)
            .Where(s => s.StoreId == store.Id && s.CreatedAt >= today && s.CreatedAt < tomorrow)
            .ToListAsync(ct);

        var debtTransactions = await db.DebtTransactions.AsNoTracking()
            .Where(d => d.StoreId == store.Id && d.Type == TransactionType.RepayDebt && d.CreatedAt >= today && d.CreatedAt < tomorrow)
            .ToListAsync(ct);

        var expenses = await db.Expenses.AsNoTracking()
            .Where(e => e.StoreId == store.Id && e.CreatedAt >= today && e.CreatedAt < tomorrow)
            .ToListAsync(ct);

        decimal totalRevenue = sales.Sum(s => s.TotalAmount);
        decimal cashSales = sales.Where(s => s.PaymentType == PaymentType.Cash).Sum(s => s.PaidAmount);
        decimal cardSales = sales.Where(s => s.PaymentType == PaymentType.Card).Sum(s => s.PaidAmount);
        decimal mixedSales = sales.Where(s => s.PaymentType == PaymentType.Mixed).Sum(s => s.PaidAmount);
        decimal debtSales = sales.Sum(s => s.DebtAmount);

        decimal debtCollected = debtTransactions.Sum(d => d.Amount);
        decimal totalExpenses = expenses.Sum(e => e.Amount);

        decimal totalCost = 0;
        foreach (var s in sales)
        {
            foreach (var item in s.Items)
            {
                totalCost += item.Quantity * item.UnitCostPrice;
            }
        }
        decimal grossProfit = totalRevenue - totalCost;
        decimal netProfit = grossProfit - totalExpenses;

        var sb = new StringBuilder();
        sb.AppendLine($"📊 <b>BUGUNGI SAVDO HISOBOTI</b>");
        sb.AppendLine($"🏪 <b>Do'kon:</b> {store.Name}");
        sb.AppendLine($"📅 <b>Sana:</b> {DateTime.Now:dd.MM.yyyy HH:mm}");
        sb.AppendLine("────────────────────────");
        sb.AppendLine($"💰 <b>Jami tushum (savdo):</b> {totalRevenue:N0} so'm");
        sb.AppendLine($"  ├ 💵 Naqd: {cashSales:N0} so'm");
        sb.AppendLine($"  ├ 💳 Karta: {cardSales:N0} so'm");
        if (mixedSales > 0) sb.AppendLine($"  ├ 🔀 Aralash to'lov: {mixedSales:N0} so'm");
        sb.AppendLine($"  └ 📝 Nasiyaga berildi: {debtSales:N0} so'm");
        if (debtCollected > 0)
        {
            sb.AppendLine($"🤝 <b>Nasiyadan undirildi:</b> {debtCollected:N0} so'm");
        }
        if (totalExpenses > 0)
        {
            sb.AppendLine($"📉 <b>Xarajatlar (chiqim):</b> {totalExpenses:N0} so'm");
        }
        sb.AppendLine($"🧾 <b>Cheklar soni:</b> {sales.Count} ta");
        sb.AppendLine("────────────────────────");
        sb.AppendLine($"📈 <b>Yalpi daromad:</b> {grossProfit:N0} so'm");
        sb.AppendLine($"💎 <b>Sof foyda:</b> <b>{netProfit:N0} so'm</b>");

        await telegramService.SendMessageAsync(token, chatId, sb.ToString(), ct);
    }

    private async Task SendKassaStatusAsync(string token, string chatId, Store store, AppDbContext db, ITelegramService telegramService, CancellationToken ct)
    {
        var openShift = await db.CashShifts.AsNoTracking()
            .Where(cs => cs.StoreId == store.Id && cs.Status == ShiftStatus.Open)
            .OrderByDescending(cs => cs.OpenedAt)
            .FirstOrDefaultAsync(ct);

        if (openShift == null)
        {
            await telegramService.SendMessageAsync(token, chatId,
                $"🔒 <b>KASSA HOLATI</b>\n" +
                $"🏪 <b>Do'kon:</b> {store.Name}\n\n" +
                $"<i>Hozirda barcha kassa smenalari yopiq.</i>", ct);
            return;
        }

        var sb = new StringBuilder();
        sb.AppendLine($"🟢 <b>OCHIQ KASSA SMENASI</b>");
        sb.AppendLine($"🏪 <b>Do'kon:</b> {store.Name}");
        sb.AppendLine($"👤 <b>Kassir:</b> {openShift.CashierName}");
        sb.AppendLine($"⏰ <b>Ochilgan:</b> {openShift.OpenedAt:dd.MM.yyyy HH:mm}");
        sb.AppendLine("────────────────────────");
        sb.AppendLine($"💵 <b>Boshlang'ich qoldiq:</b> {openShift.OpeningBalance:N0} so'm");
        sb.AppendLine($"💰 <b>Naqd tushum:</b> {openShift.TotalCashSales:N0} so'm");
        sb.AppendLine($"💳 <b>Karta tushum:</b> {openShift.TotalCardSales:N0} so'm");
        sb.AppendLine($"📝 <b>Nasiya savdo:</b> {openShift.TotalDebtSales:N0} so'm");
        if (openShift.TotalCashIn > 0)
            sb.AppendLine($"📥 <b>Kassaga solindi (Vnesenie):</b> +{openShift.TotalCashIn:N0} so'm");
        if (openShift.TotalCashOut > 0)
            sb.AppendLine($"📤 <b>Inkassatsiya:</b> -{openShift.TotalCashOut:N0} so'm");
        if (openShift.TotalExpensesCash > 0)
            sb.AppendLine($"📉 <b>Chiqim:</b> -{openShift.TotalExpensesCash:N0} so'm");
        sb.AppendLine($"🧾 <b>Cheklar soni:</b> {openShift.TotalSalesCount} ta");
        sb.AppendLine("────────────────────────");
        sb.AppendLine($"🎯 <b>Kassada bo'lishi kerak naqd:</b> <b>{openShift.ExpectedCash:N0} so'm</b>");

        await telegramService.SendMessageAsync(token, chatId, sb.ToString(), ct);
    }

    private async Task SendDebtsReportAsync(string token, string chatId, Store store, AppDbContext db, ITelegramService telegramService, CancellationToken ct)
    {
        var debtors = await db.Customers.AsNoTracking()
            .Where(c => c.StoreId == store.Id && c.TotalDebt > 0)
            .OrderByDescending(c => c.TotalDebt)
            .ToListAsync(ct);

        decimal totalDebt = debtors.Sum(c => c.TotalDebt);

        var sb = new StringBuilder();
        sb.AppendLine($"👥 <b>NASIYA QARZDORLIK HISOBOTI</b>");
        sb.AppendLine($"🏪 <b>Do'kon:</b> {store.Name}");
        sb.AppendLine($"💸 <b>Umumiy qarz summasi:</b> <b>{totalDebt:N0} so'm</b>");
        sb.AppendLine($"📊 <b>Qarzdor mijozlar:</b> {debtors.Count} nafar");
        sb.AppendLine("────────────────────────");

        if (debtors.Count == 0)
        {
            sb.AppendLine("<i>Ajoyib! Hozirda hech qanday nasiya qarzdorlik yo'q.</i>");
        }
        else
        {
            sb.AppendLine("<b>Eng katta qarzdorlar (Top 5):</b>");
            int i = 1;
            foreach (var d in debtors.Take(5))
            {
                sb.AppendLine($"{i++}. <b>{d.FullName}</b> ({d.Phone})");
                sb.AppendLine($"   └ 💰 <b>{d.TotalDebt:N0} so'm</b>");
            }
        }

        await telegramService.SendMessageAsync(token, chatId, sb.ToString(), ct);
    }

    private async Task SendLowStockReportAsync(string token, string chatId, Store store, AppDbContext db, ITelegramService telegramService, CancellationToken ct)
    {
        var lowStock = await db.Products.AsNoTracking()
            .Where(p => p.StoreId == store.Id && p.StockQuantity <= p.MinStockAlert)
            .OrderBy(p => p.StockQuantity)
            .Take(15)
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine($"📦 <b>TUGAB BORAYOTGAN TOVARLAR</b>");
        sb.AppendLine($"🏪 <b>Do'kon:</b> {store.Name}");
        sb.AppendLine("────────────────────────");

        if (lowStock.Count == 0)
        {
            sb.AppendLine("✅ <i>Barcha tovarlar zaxirasi yetarli darajada!</i>");
        }
        else
        {
            int i = 1;
            foreach (var p in lowStock)
            {
                sb.AppendLine($"{i++}. <b>{p.Name}</b>: <u>{p.StockQuantity} {p.Unit}</u> (Min: {p.MinStockAlert})");
            }
        }

        await telegramService.SendMessageAsync(token, chatId, sb.ToString(), ct);
    }

    private async Task SearchCustomerByPhoneAsync(string token, string chatId, string cleanPhone, int storeId, AppDbContext db, ITelegramService telegramService, CancellationToken ct)
    {
        var customer = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.StoreId == storeId && c.Phone.Contains(cleanPhone), ct);

        if (customer == null)
        {
            await telegramService.SendMessageAsync(token, chatId, $"❌ Telefon raqami bo'yicha mijoz topilmadi: {cleanPhone}", ct);
            return;
        }

        var sb = new StringBuilder();
        sb.AppendLine($"👤 <b>MIJOZ MA'LUMOTI</b>");
        sb.AppendLine($"Ism: <b>{customer.FullName}</b>");
        sb.AppendLine($"Telefon: {customer.Phone}");
        sb.AppendLine("────────────────────────");
        sb.AppendLine($"💳 <b>Keshbek balansi:</b> {customer.CashbackBalance:N0} so'm");
        sb.AppendLine($"📝 <b>Joriy qarzi:</b> <b>{customer.TotalDebt:N0} so'm</b>");

        await telegramService.SendMessageAsync(token, chatId, sb.ToString(), ct);
    }
}

