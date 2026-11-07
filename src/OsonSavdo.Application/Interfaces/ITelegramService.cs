using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Application.Interfaces;

public interface ITelegramService
{
    Task<bool> SendMessageAsync(string? botToken, string? chatId, string message, CancellationToken ct = default);
    Task<bool> SendShiftClosedReportAsync(CashShift shift, Store? store, CancellationToken ct = default);
    Task<bool> SendLowStockAlertAsync(Store? store, List<Product> lowStockProducts, CancellationToken ct = default);
    Task<bool> SendDebtReminderAsync(Store? store, Customer customer, CancellationToken ct = default);
    Task<bool> SendDocumentAsync(string? botToken, string? chatId, byte[] fileBytes, string fileName, string? caption = null, CancellationToken ct = default);
}
