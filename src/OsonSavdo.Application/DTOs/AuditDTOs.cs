namespace OsonSavdo.Application.DTOs;

public record InventoryAuditItemDto(
    int Id,
    int ProductId,
    string ProductName,
    string Barcode,
    decimal ExpectedQuantity,
    decimal ActualQuantity,
    decimal Difference,
    decimal CostPrice,
    decimal DifferenceCost
);

public record InventoryAuditResponseDto(
    int Id,
    string AuditNumber,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    string Status,
    string CashierName,
    decimal TotalExpectedQty,
    decimal TotalActualQty,
    decimal TotalDifferenceQty,
    decimal TotalDifferenceCost,
    string? Note,
    List<InventoryAuditItemDto> Items
);

public record CreateInventoryAuditDto(
    string? Note,
    List<CreateAuditItemDto>? Items
);

public record CreateAuditItemDto(
    int ProductId,
    decimal ActualQuantity
);

public record UpdateAuditItemDto(
    int ProductId,
    decimal ActualQuantity
);
