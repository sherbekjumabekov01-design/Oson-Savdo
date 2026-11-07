namespace OsonSavdo.Application.DTOs;

public record SupplierResponseDto(
    int Id,
    string Name,
    string Phone,
    string? Company,
    string? Address,
    decimal TotalDebtToSupplier,
    DateTime CreatedAt
);

public record CreateSupplierDto(
    string Name,
    string Phone,
    string? Company,
    string? Address
);

public record UpdateSupplierDto(
    string Name,
    string Phone,
    string? Company,
    string? Address
);

public record PaySupplierDebtDto(
    int SupplierId,
    decimal Amount,
    string? Note
);

public record CreateSupplyInvoiceItemDto(
    int? ProductId,
    string Barcode,
    string Name,
    decimal Quantity,
    decimal CostPrice,
    decimal SellingPrice,
    string Unit,
    string? Category
);

public record CreateSupplyInvoiceDto(
    int? SupplierId,
    string? SupplierName,
    string InvoiceNumber,
    decimal PaidAmount,
    string? Note,
    List<CreateSupplyInvoiceItemDto> Items
);

public record SupplyInvoiceItemResponseDto(
    int Id,
    int ProductId,
    string ProductName,
    decimal Quantity,
    decimal CostPrice,
    decimal SellingPrice,
    decimal Subtotal
);

public record SupplyInvoiceResponseDto(
    int Id,
    int? SupplierId,
    string SupplierName,
    string InvoiceNumber,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal DebtAmount,
    DateTime CreatedAt,
    string? Note,
    List<SupplyInvoiceItemResponseDto> Items
);
