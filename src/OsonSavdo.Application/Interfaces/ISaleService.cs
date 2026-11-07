using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface ISaleService
{
    Task<SaleResponseDto> ProcessSaleAsync(CreateSaleDto dto, CancellationToken ct = default);
    Task<SaleResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<SaleResponseDto>> GetSalesAsync(DateTime? fromDate = null, DateTime? toDate = null, int? customerId = null, CancellationToken ct = default);
}
