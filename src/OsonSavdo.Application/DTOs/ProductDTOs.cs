using System.ComponentModel.DataAnnotations;

namespace OsonSavdo.Application.DTOs;

public record CreateProductDto
{
    [Required(ErrorMessage = "Shtrix-kod majburiy")]
    [MaxLength(64)]
    public string Barcode { get; init; } = string.Empty;

    [Required(ErrorMessage = "Mahsulot nomi majburiy")]
    [MaxLength(200)]
    public string Name { get; init; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "Tannarx manfiy bo'lishi mumkin emas")]
    public decimal CostPrice { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Sotish narxi manfiy bo'lishi mumkin emas")]
    public decimal SellingPrice { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Miqdor manfiy bo'lishi mumkin emas")]
    public decimal StockQuantity { get; init; }

    public string Unit { get; init; } = "dona";

    public string Category { get; init; } = "Umumiy";

    public decimal MinStockAlert { get; init; } = 5;
    public bool IsWeighted { get; init; } = false;
    public string? PluCode { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public bool IsUsdPrice { get; init; } = false;
    public decimal CostPriceUsd { get; init; } = 0;
    public decimal SellingPriceUsd { get; init; } = 0;
}

public record UpdateProductDto
{
    [Required(ErrorMessage = "Shtrix-kod majburiy")]
    [MaxLength(64)]
    public string Barcode { get; init; } = string.Empty;

    [Required(ErrorMessage = "Mahsulot nomi majburiy")]
    [MaxLength(200)]
    public string Name { get; init; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; init; }

    [Range(0, double.MaxValue)]
    public decimal SellingPrice { get; init; }

    [Range(0, double.MaxValue)]
    public decimal StockQuantity { get; init; }

    public string Unit { get; init; } = "dona";

    public string Category { get; init; } = "Umumiy";

    public decimal MinStockAlert { get; init; } = 5;
    public bool IsWeighted { get; init; } = false;
    public string? PluCode { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public bool IsUsdPrice { get; init; } = false;
    public decimal CostPriceUsd { get; init; } = 0;
    public decimal SellingPriceUsd { get; init; } = 0;
}

public record ProductResponseDto
{
    public int Id { get; init; }
    public string Barcode { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public decimal CostPrice { get; init; }
    public decimal SellingPrice { get; init; }
    public decimal StockQuantity { get; init; }
    public string Unit { get; init; } = "dona";
    public string Category { get; init; } = "Umumiy";
    public decimal MinStockAlert { get; init; }
    public bool IsLowStock => StockQuantity <= MinStockAlert;
    public bool IsWeighted { get; init; }
    public string? PluCode { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public bool IsUsdPrice { get; init; }
    public decimal CostPriceUsd { get; init; }
    public decimal SellingPriceUsd { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record PagedResultDto<T>(
    List<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);

public record ImportResultDto(
    int TotalProcessed,
    int AddedCount,
    int UpdatedCount,
    List<string> Errors
);
