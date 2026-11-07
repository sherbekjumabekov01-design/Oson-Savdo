using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface IExpenseService
{
    Task<IEnumerable<ExpenseResponseDto>> GetAllAsync(DateTime? fromDate = null, DateTime? toDate = null, string? category = null, CancellationToken ct = default);
    Task<ExpenseResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto, int? userId = null, string? cashierName = null, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
