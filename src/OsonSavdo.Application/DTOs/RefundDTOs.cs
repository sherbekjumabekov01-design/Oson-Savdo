namespace OsonSavdo.Application.DTOs;

public record RefundItemDto(
    int ProductId,
    decimal Quantity,
    decimal RefundPrice
);

public record CreateRefundDto(
    int SaleId,
    string Reason,
    string? CashierName,
    List<RefundItemDto> Items
);

public record SaleRefundItemResponseDto(
    int Id,
    int ProductId,
    string ProductName,
    decimal Quantity,
    decimal RefundUnitPrice,
    decimal Subtotal
);

public record SaleRefundResponseDto(
    int Id,
    int SaleId,
    string CashierName,
    decimal TotalRefundAmount,
    string Reason,
    DateTime CreatedAt,
    List<SaleRefundItemResponseDto> Items
);
