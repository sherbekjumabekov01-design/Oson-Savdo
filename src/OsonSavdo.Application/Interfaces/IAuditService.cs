using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface IAuditService
{
    Task<List<InventoryAuditResponseDto>> GetAuditsAsync(CancellationToken ct = default);
    Task<InventoryAuditResponseDto> GetAuditByIdAsync(int id, CancellationToken ct = default);
    Task<InventoryAuditResponseDto> CreateAuditAsync(string cashierName, CreateInventoryAuditDto dto, CancellationToken ct = default);
    Task<InventoryAuditResponseDto> UpdateAuditItemAsync(int auditId, UpdateAuditItemDto dto, CancellationToken ct = default);
    Task<InventoryAuditResponseDto> CompleteAuditAsync(int auditId, CancellationToken ct = default);
}
