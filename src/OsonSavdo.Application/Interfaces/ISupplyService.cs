using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface ISupplyService
{
    Task<List<SupplierResponseDto>> GetSuppliersAsync(CancellationToken ct = default);
    Task<SupplierResponseDto> CreateSupplierAsync(CreateSupplierDto dto, CancellationToken ct = default);
    Task<SupplierResponseDto> UpdateSupplierAsync(int id, UpdateSupplierDto dto, CancellationToken ct = default);
    Task<SupplierResponseDto> PaySupplierDebtAsync(PaySupplierDebtDto dto, CancellationToken ct = default);

    Task<List<SupplyInvoiceResponseDto>> GetInvoicesAsync(int? supplierId = null, CancellationToken ct = default);
    Task<SupplyInvoiceResponseDto> ReceiveGoodsAsync(CreateSupplyInvoiceDto dto, CancellationToken ct = default);
}
