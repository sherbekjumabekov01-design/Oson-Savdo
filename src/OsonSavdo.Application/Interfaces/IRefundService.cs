using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface IRefundService
{
    Task<SaleRefundResponseDto> ProcessRefundAsync(CreateRefundDto dto, CancellationToken ct = default);
    Task<List<SaleRefundResponseDto>> GetRefundsAsync(int? saleId = null, CancellationToken ct = default);
}
