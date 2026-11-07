using System.ComponentModel.DataAnnotations;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Application.DTOs;

public record CreateSaleItemDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Yaroqli mahsulot Id kiritilishi shart")]
    public int ProductId { get; init; }

    [Required]
    [Range(0.001, double.MaxValue, ErrorMessage = "Miqdor 0 dan katta bo'lishi kerak")]
    public decimal Quantity { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Sotish narxi manfiy bo'lishi mumkin emas")]
    public decimal? UnitSellingPrice { get; init; } // Nullable: agar berilmasa, mahsulotning standart narxi olinadi

    public decimal DiscountAmount { get; init; } = 0;
}

public record CreateSaleDto
{
    [Required(ErrorMessage = "Kamida bitta mahsulot kiritilishi shart")]
    [MinLength(1, ErrorMessage = "Savdoda kamida 1 ta mahsulot bo'lishi shart")]
    public List<CreateSaleItemDto> Items { get; init; } = new();

    public PaymentType PaymentType { get; init; } = PaymentType.Cash;

    [Range(0, double.MaxValue, ErrorMessage = "To'langan summa manfiy bo'lishi mumkin emas")]
    public decimal PaidAmount { get; init; }

    public decimal DiscountAmount { get; init; } = 0;
    public decimal PaidCash { get; init; } = 0;
    public decimal PaidCard { get; init; } = 0;
    public decimal CashbackUsed { get; init; } = 0;
    public string CashierName { get; init; } = "Kassir";
    public int? CashShiftId { get; init; }

    public int? CustomerId { get; init; }
}

public record SaleItemResponseDto
{
    public int Id { get; init; }
    public int ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string ProductBarcode { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public decimal UnitCostPrice { get; init; }
    public decimal UnitSellingPrice { get; init; }
    public decimal DiscountAmount { get; init; }
    public decimal RefundedQuantity { get; init; }
    public decimal Subtotal => (Quantity * UnitSellingPrice) - DiscountAmount;
    public decimal GrossProfit => ((UnitSellingPrice - UnitCostPrice) * Quantity) - DiscountAmount;
}

public record SaleResponseDto
{
    public int Id { get; init; }
    public decimal TotalAmount { get; init; }
    public decimal PaidAmount { get; init; }
    public decimal DebtAmount { get; init; }
    public decimal DiscountAmount { get; init; }
    public decimal PaidCash { get; init; }
    public decimal PaidCard { get; init; }
    public decimal CashbackEarned { get; init; }
    public decimal CashbackUsed { get; init; }
    public PaymentType PaymentType { get; init; }
    public SaleStatus Status { get; init; }
    public string CashierName { get; init; } = "Kassir";
    public int? CashShiftId { get; init; }
    public int? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<SaleItemResponseDto> Items { get; init; } = new();
}
