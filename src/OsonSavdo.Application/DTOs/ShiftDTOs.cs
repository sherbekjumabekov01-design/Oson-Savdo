using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Application.DTOs;

public record OpenShiftDto(decimal OpeningBalance, string? Note);

public record CloseShiftDto(decimal ClosingCashActual, string? Note);

public record CreateCashOperationDto(
    CashOperationType Type,
    decimal Amount,
    string Reason
);

public record CashOperationResponseDto(
    int Id,
    int CashShiftId,
    CashOperationType Type,
    decimal Amount,
    string Reason,
    string PerformedBy,
    DateTime CreatedAt
);

public record CashShiftResponseDto(
    int Id,
    int UserId,
    string CashierName,
    DateTime OpenedAt,
    DateTime? ClosedAt,
    decimal OpeningBalance,
    decimal ClosingCashActual,
    decimal ExpectedCash,
    decimal CashDifference,
    decimal TotalCashSales,
    decimal TotalCardSales,
    decimal TotalDebtSales,
    decimal TotalRefunds,
    int TotalSalesCount,
    ShiftStatus Status,
    string? Note,
    decimal TotalDebtRepaidCash = 0,
    decimal TotalDebtRepaidCard = 0,
    decimal TotalExpensesCash = 0,
    decimal TotalCashIn = 0,
    decimal TotalCashOut = 0,
    List<CashOperationResponseDto>? Operations = null
);

public record CurrentShiftSummaryDto(
    bool IsOpen,
    CashShiftResponseDto? Shift,
    decimal CurrentCalculatedCash
);
