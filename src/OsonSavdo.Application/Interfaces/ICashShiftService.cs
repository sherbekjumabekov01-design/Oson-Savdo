using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface ICashShiftService
{
    Task<CurrentShiftSummaryDto> GetCurrentShiftAsync(CancellationToken ct = default);
    Task<CashShiftResponseDto> OpenShiftAsync(int userId, string cashierName, OpenShiftDto dto, CancellationToken ct = default);
    Task<CashShiftResponseDto> CloseShiftAsync(int shiftId, CloseShiftDto dto, CancellationToken ct = default);
    Task<List<CashShiftResponseDto>> GetShiftHistoryAsync(int limit = 30, CancellationToken ct = default);
    Task<CashShiftResponseDto?> GetActiveShiftEntityAsync(CancellationToken ct = default);
    Task<CashOperationResponseDto> AddCashOperationAsync(int shiftId, CreateCashOperationDto dto, string performedBy, CancellationToken ct = default);
    Task<List<CashOperationResponseDto>> GetShiftOperationsAsync(int shiftId, CancellationToken ct = default);
}
