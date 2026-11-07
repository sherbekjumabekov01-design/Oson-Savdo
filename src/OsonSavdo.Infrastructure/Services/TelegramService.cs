using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Infrastructure.Services;

public class TelegramService : ITelegramService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TelegramService> _logger;

    public TelegramService(HttpClient httpClient, ILogger<TelegramService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> SendMessageAsync(string? botToken, string? chatId, string message, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(botToken) || string.IsNullOrWhiteSpace(chatId))
        {
            _logger.LogInformation("Telegram bildirishnomasi yuborilmadi: BotToken yoki ChatId ko'rsatilmagan.");
            return false;
        }

        try
        {
            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
            var payload = new
            {
                chat_id = chatId,
                text = message,
                parse_mode = "HTML"
            };

            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content, ct);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Telegram xabari muvaffaqiyatli yuborildi: {ChatId}", chatId);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Telegram API xatosi ({StatusCode}): {Error}", response.StatusCode, err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegram xabarnomasini yuborishda xatolik yuz berdi.");
            return false;
        }
    }

    public async Task<bool> SendShiftClosedReportAsync(CashShift shift, Store? store, CancellationToken ct = default)
    {
        if (store == null || !store.TelegramNotificationsEnabled || string.IsNullOrWhiteSpace(store.TelegramBotToken) || string.IsNullOrWhiteSpace(store.TelegramChatId))
            return false;

        var diffEmoji = shift.CashDifference == 0 ? "✅ Aniq (0 so'm)" : (shift.CashDifference > 0 ? $"🟢 Ortiqcha: +{shift.CashDifference:N0} so'm" : $"🔴 Kamomad: {shift.CashDifference:N0} so'm");
        var storeTitle = store.Name ?? "Oson Savdo Do'koni";

        var sb = new StringBuilder();
        sb.AppendLine($"📊 <b>KASSA SMENASI YOPILDI (Z-HISOBOT)</b>");
        sb.AppendLine($"🏪 <b>Do'kon:</b> {storeTitle}");
        sb.AppendLine($"👤 <b>Kassir:</b> {shift.CashierName}");
        sb.AppendLine($"⏰ <b>Ochilgan vaqti:</b> {shift.OpenedAt:dd.MM.yyyy HH:mm}");
        sb.AppendLine($"🔒 <b>Yopilgan vaqti:</b> {(shift.ClosedAt ?? DateTime.UtcNow):dd.MM.yyyy HH:mm}");
        sb.AppendLine("────────────────────────");
        sb.AppendLine($"💵 <b>Boshlang'ich qoldiq:</b> {shift.OpeningBalance:N0} so'm");
        sb.AppendLine($"💰 <b>Naqd savdo:</b> {shift.TotalCashSales:N0} so'm");
        sb.AppendLine($"💳 <b>Karta savdosi:</b> {shift.TotalCardSales:N0} so'm");
        sb.AppendLine($"📝 <b>Nasiyaga (Qarz):</b> {shift.TotalDebtSales:N0} so'm");
        if (shift.TotalDebtRepaidCash > 0 || shift.TotalDebtRepaidCard > 0)
        {
            sb.AppendLine($"🤝 <b>Nasiyadan tushum:</b>");
            if (shift.TotalDebtRepaidCash > 0)
                sb.AppendLine($"  └ 💵 Naqd: {shift.TotalDebtRepaidCash:N0} so'm");
            if (shift.TotalDebtRepaidCard > 0)
                sb.AppendLine($"  └ 💳 Karta: {shift.TotalDebtRepaidCard:N0} so'm");
        }
        sb.AppendLine($"↩️ <b>Vozvrat (Qaytarildi):</b> {shift.TotalRefunds:N0} so'm");
        if (shift.TotalExpensesCash > 0)
        {
            sb.AppendLine($"📉 <b>Kassadan xarajat (Chiqim):</b> {shift.TotalExpensesCash:N0} so'm");
        }
        if (shift.TotalCashIn > 0)
        {
            sb.AppendLine($"📥 <b>Kassaga kiritildi (Vnesenie):</b> +{shift.TotalCashIn:N0} so'm");
        }
        if (shift.TotalCashOut > 0)
        {
            sb.AppendLine($"📤 <b>Inkassatsiya (Kassadan olindi):</b> -{shift.TotalCashOut:N0} so'm");
        }
        sb.AppendLine($"🧾 <b>Savdolar soni:</b> {shift.TotalSalesCount} ta chek");
        sb.AppendLine("────────────────────────");
        sb.AppendLine($"🎯 <b>Kutilgan kassa naqdi:</b> {shift.ExpectedCash:N0} so'm");
        sb.AppendLine($"📥 <b>Kassir sanagan naqd:</b> {shift.ClosingCashActual:N0} so'm");
        sb.AppendLine($"⚖️ <b>Farq:</b> {diffEmoji}");

        return await SendMessageAsync(store.TelegramBotToken, store.TelegramChatId, sb.ToString(), ct);
    }

    public async Task<bool> SendLowStockAlertAsync(Store? store, List<Product> lowStockProducts, CancellationToken ct = default)
    {
        if (store == null || !store.TelegramNotificationsEnabled || string.IsNullOrWhiteSpace(store.TelegramBotToken) || string.IsNullOrWhiteSpace(store.TelegramChatId))
            return false;

        if (lowStockProducts == null || lowStockProducts.Count == 0)
            return false;

        var sb = new StringBuilder();
        sb.AppendLine($"⚠️ <b>DIQQAT: TOVARLAR TUGAB BORMOQDA!</b>");
        sb.AppendLine($"🏪 <b>Do'kon:</b> {store.Name}");
        sb.AppendLine($"📦 <i>Quyidagi {lowStockProducts.Count} ta tovar zaxirasi kam qoldi:</i>\n");

        int count = 1;
        foreach (var p in lowStockProducts.Take(15))
        {
            sb.AppendLine($"{count++}. <b>{p.Name}</b>: <u>{p.StockQuantity} {p.Unit}</u> (Minimal chegara: {p.MinStockAlert})");
        }

        if (lowStockProducts.Count > 15)
        {
            sb.AppendLine($"\n...va yana {lowStockProducts.Count - 15} ta tovar.");
        }

        return await SendMessageAsync(store.TelegramBotToken, store.TelegramChatId, sb.ToString(), ct);
    }

    public async Task<bool> SendDebtReminderAsync(Store? store, Customer customer, CancellationToken ct = default)
    {
        if (store == null || string.IsNullOrWhiteSpace(store.TelegramBotToken) || string.IsNullOrWhiteSpace(store.TelegramChatId))
            return false;

        var storeTitle = store.Name ?? "Oson Savdo Do'koni";
        var phone = store.Phone ?? "";

        var sb = new StringBuilder();
        sb.AppendLine($"📢 <b>NASIYA QARZ ESLATMASI</b>");
        sb.AppendLine($"👤 <b>Mijoz:</b> {customer.FullName}");
        sb.AppendLine($"📞 <b>Telefon:</b> {customer.Phone}");
        sb.AppendLine($"💸 <b>Umumiy qarz summasi:</b> <b>{customer.TotalDebt:N0} so'm</b>");
        sb.AppendLine($"🏪 <b>Do'kon:</b> {storeTitle} ({phone})");
        sb.AppendLine("────────────────────────");
        sb.AppendLine("<i>Iltimos, o'z vaqtida hisob-kitob qilishni unutmang. Rahmat!</i>");

        return await SendMessageAsync(store.TelegramBotToken, store.TelegramChatId, sb.ToString(), ct);
    }

    public async Task<bool> SendDocumentAsync(string? botToken, string? chatId, byte[] fileBytes, string fileName, string? caption = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(botToken) || string.IsNullOrWhiteSpace(chatId) || fileBytes == null || fileBytes.Length == 0)
        {
            _logger.LogInformation("Telegram sendDocument bekor qilindi: token, chatId yoki fayl mavjud emas.");
            return false;
        }

        try
        {
            var url = $"https://api.telegram.org/bot{botToken}/sendDocument";
            using var form = new MultipartFormDataContent();
            form.Add(new StringContent(chatId), "chat_id");
            if (!string.IsNullOrWhiteSpace(caption))
            {
                form.Add(new StringContent(caption), "caption");
                form.Add(new StringContent("HTML"), "parse_mode");
            }

            var fileContent = new ByteArrayContent(fileBytes);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
            form.Add(fileContent, "document", fileName);

            var response = await _httpClient.PostAsync(url, form, ct);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Telegram orqali fayl muvaffaqiyatli yuborildi: {FileName} -> {ChatId}", fileName, chatId);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Telegram sendDocument API xatosi ({StatusCode}): {Error}", response.StatusCode, err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegram sendDocument yuborishda xatolik yuz berdi.");
            return false;
        }
    }
}
