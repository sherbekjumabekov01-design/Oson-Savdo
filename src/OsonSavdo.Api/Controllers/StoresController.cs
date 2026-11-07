using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoresController : ControllerBase
{
    private readonly IStoreService _storeService;
    private readonly ITelegramService _telegramService;

    public StoresController(IStoreService storeService, ITelegramService telegramService)
    {
        _storeService = storeService;
        _telegramService = telegramService;
    }

    [HttpGet]
    public async Task<ActionResult<List<StoreResponseDto>>> GetAll(CancellationToken ct = default)
    {
        var stores = await _storeService.GetAllStoresAsync(ct);
        return Ok(stores);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<PlatformStatsDto>> GetStats(CancellationToken ct = default)
    {
        var stats = await _storeService.GetPlatformStatsAsync(ct);
        return Ok(stats);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StoreResponseDto>> GetById(int id, CancellationToken ct = default)
    {
        var store = await _storeService.GetStoreByIdAsync(id, ct);
        return Ok(store);
    }

    [HttpGet("{id:int}/overview")]
    public async Task<ActionResult<StoreOverviewDto>> GetOverview(int id, CancellationToken ct = default)
    {
        var overview = await _storeService.GetStoreOverviewAsync(id, ct);
        return Ok(overview);
    }

    [HttpPost]
    public async Task<ActionResult<StoreResponseDto>> Create([FromBody] CreateStoreDto dto, CancellationToken ct = default)
    {
        var created = await _storeService.CreateStoreAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<StoreResponseDto>> Update(int id, [FromBody] UpdateStoreDto dto, CancellationToken ct = default)
    {
        var updated = await _storeService.UpdateStoreAsync(id, dto, ct);
        return Ok(updated);
    }

    [HttpPut("{id:int}/settings")]
    public async Task<ActionResult<StoreResponseDto>> UpdateSettings(int id, [FromBody] StoreSettingsDto dto, CancellationToken ct = default)
    {
        var updated = await _storeService.UpdateStoreSettingsAsync(id, dto, ct);
        return Ok(updated);
    }

    [HttpPost("{id:int}/test-telegram")]
    public async Task<ActionResult<object>> TestTelegram(int id, CancellationToken ct = default)
    {
        var store = await _storeService.GetStoreByIdAsync(id, ct);
        if (string.IsNullOrWhiteSpace(store.TelegramBotToken) || string.IsNullOrWhiteSpace(store.TelegramChatId))
            return BadRequest(new { success = false, message = "Telegram Bot Token yoki Chat ID kiritilmagan." });

        var msg = $"🔔 <b>OSON SAVDO - TELEGRAM TEST BOG'LANISHI</b>\n🏪 <b>Do'kon:</b> {store.Name}\n✅ <i>Telegram bot muvaffaqiyatli ulandi va xabarnomalar yuborishga tayyor!</i>";
        var success = await _telegramService.SendMessageAsync(store.TelegramBotToken, store.TelegramChatId, msg, ct);
        return Ok(new { success, message = success ? "Test xabarnomasi muvaffaqiyatli yuborildi!" : "Telegram xabarnomasini yuborishda xatolik yuz berdi. Token va Chat ID ni tekshiring." });
    }

    [HttpPut("{id:int}/toggle-status")]
    public async Task<ActionResult<bool>> ToggleStatus(int id, CancellationToken ct = default)
    {
        var isActive = await _storeService.ToggleStoreStatusAsync(id, ct);
        return Ok(new { isActive });
    }

    [HttpPost("{id:int}/extend-subscription")]
    public async Task<ActionResult<StoreResponseDto>> ExtendSubscription(int id, [FromBody] ExtendSubscriptionDto dto, CancellationToken ct = default)
    {
        var updated = await _storeService.ExtendSubscriptionAsync(id, dto.Days, ct);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _storeService.DeleteStoreAsync(id, ct);
        return Ok(new { success = true, message = "Do'kon muvaffaqiyatli o'chirildi." });
    }

    [HttpPost("{id:int}/reset-password")]
    public async Task<ActionResult> ResetAdminPassword(int id, [FromBody] ResetAdminPasswordDto dto, CancellationToken ct = default)
    {
        await _storeService.ResetAdminPasswordAsync(id, dto.NewPassword, ct);
        return Ok(new { success = true, message = "Admin paroli muvaffaqiyatli yangilandi." });
    }

    [HttpGet("payments")]
    public async Task<ActionResult<List<SubscriptionPaymentDto>>> GetPayments(CancellationToken ct = default)
    {
        var payments = await _storeService.GetSubscriptionPaymentsAsync(ct);
        return Ok(payments);
    }

    [HttpPost("{id:int}/payments")]
    public async Task<ActionResult<SubscriptionPaymentDto>> RecordPayment(int id, [FromBody] RecordPaymentDto dto, CancellationToken ct = default)
    {
        var payment = await _storeService.RecordSubscriptionPaymentAsync(dto with { StoreId = id }, ct);
        return Ok(payment);
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<PlatformAnalyticsDto>> GetAnalytics(CancellationToken ct = default)
    {
        var analytics = await _storeService.GetPlatformAnalyticsAsync(ct);
        return Ok(analytics);
    }

    [HttpGet("announcements")]
    public async Task<ActionResult<List<PlatformAnnouncementDto>>> GetAnnouncements(CancellationToken ct = default)
    {
        var list = await _storeService.GetAnnouncementsAsync(ct);
        return Ok(list);
    }

    [HttpPost("announcements")]
    public async Task<ActionResult<PlatformAnnouncementDto>> CreateAnnouncement([FromBody] CreateAnnouncementDto dto, CancellationToken ct = default)
    {
        var created = await _storeService.CreateAnnouncementAsync(dto, ct);
        return Ok(created);
    }

    [HttpDelete("announcements/{id:int}")]
    public async Task<ActionResult> DeleteAnnouncement(int id, CancellationToken ct = default)
    {
        await _storeService.DeleteAnnouncementAsync(id, ct);
        return Ok(new { success = true });
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct = default)
    {
        var bytes = await _storeService.ExportStoresCsvAsync(ct);
        return File(bytes, "text/csv", $"OsonSavdo_Stores_{DateTime.UtcNow:yyyyMMdd_HHmm}.csv");
    }

    [HttpPost("bulk-extend")]
    public async Task<ActionResult<object>> BulkExtend([FromBody] BulkExtendSubscriptionDto dto, CancellationToken ct = default)
    {
        var count = await _storeService.BulkExtendSubscriptionAsync(dto, ct);
        return Ok(new { success = true, count, message = $"{count} ta do'kon obunasi muvaffaqiyatli uzaytirildi." });
    }

    [HttpPost("bulk-toggle-status")]
    public async Task<ActionResult<object>> BulkToggleStatus([FromBody] BulkToggleStatusDto dto, CancellationToken ct = default)
    {
        var count = await _storeService.BulkToggleStatusAsync(dto, ct);
        return Ok(new { success = true, count, message = $"{count} ta do'kon holati muvaffaqiyatli o'zgartirildi." });
    }

    [HttpPost("bulk-change-plan")]
    public async Task<ActionResult<object>> BulkChangePlan([FromBody] BulkChangePlanDto dto, CancellationToken ct = default)
    {
        var count = await _storeService.BulkChangePlanAsync(dto, ct);
        return Ok(new { success = true, count, message = $"{count} ta do'kon tarifi muvaffaqiyatli o'zgartirildi." });
    }

    [HttpPost("broadcast-telegram")]
    public async Task<ActionResult<BroadcastResultDto>> BroadcastTelegram([FromBody] BroadcastTelegramDto dto, CancellationToken ct = default)
    {
        var result = await _storeService.BroadcastTelegramAsync(dto, ct);
        return Ok(result);
    }

    [HttpPost("send-expiry-alerts")]
    public async Task<ActionResult<SendExpiryAlertsResultDto>> SendExpiryAlerts(CancellationToken ct = default)
    {
        var result = await _storeService.SendSubscriptionExpiryAlertsAsync(ct);
        return Ok(result);
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<List<PlatformAuditLogDto>>> GetAuditLogs([FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var logs = await _storeService.GetPlatformAuditLogsAsync(limit, ct);
        return Ok(logs);
    }

    [HttpGet("system-health")]
    public async Task<ActionResult<SystemHealthDto>> GetSystemHealth(CancellationToken ct = default)
    {
        var health = await _storeService.GetSystemHealthAsync(ct);
        return Ok(health);
    }
}
