using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BackupController : ControllerBase
{
    private readonly IBackupService _backupService;
    private readonly ICurrentStoreContext _storeContext;

    public BackupController(IBackupService backupService, ICurrentStoreContext storeContext)
    {
        _backupService = backupService;
        _storeContext = storeContext;
    }

    /// <summary>
    /// Ma'lumotlar bazasining ZIP arxivdagi to'liq zaxira nusxasini yuklab olish
    /// </summary>
    [HttpGet("download")]
    public async Task<IActionResult> DownloadBackup(CancellationToken ct)
    {
        var zipBytes = await _backupService.CreateDatabaseBackupZipAsync(ct);
        var fileName = $"OsonSavdo_Backup_{DateTime.Now:yyyyMMdd_HHmmss}.zip";
        return File(zipBytes, "application/zip", fileName);
    }

    /// <summary>
    /// Ma'lumotlar bazasi zaxira nusxasini hozirning o'zida do'kon egasining Telegramiga jo'natish
    /// </summary>
    [HttpPost("send-telegram")]
    public async Task<IActionResult> SendToTelegram(CancellationToken ct)
    {
        var success = await _backupService.SendBackupToTelegramAsync(_storeContext.StoreId, ct);
        if (!success)
        {
            return BadRequest(new { message = "Telegram sozlamalari (bot token va chat id) kiritilmagan yoki xabarni jo'natib bo'lmadi." });
        }

        return Ok(new { message = "Baza zaxira nusxasi Telegramga muvaffaqiyatli yuborildi." });
    }
}
