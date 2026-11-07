using System.ComponentModel.DataAnnotations;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Application.DTOs;

public record CreateExpenseDto
{
    [Required(ErrorMessage = "Xarajat nomi majburiy")]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Summa 0 dan katta bo'lishi kerak")]
    public decimal Amount { get; init; }

    [Required(ErrorMessage = "Kategoriya majburiy (masalan: Ijara, Ish haqi, Kommunal, Boshqa)")]
    [MaxLength(100)]
    public string Category { get; init; } = string.Empty;

    public PaymentType PaymentType { get; init; } = PaymentType.Cash;
    public string? CreatedByName { get; init; }
}

public record ExpenseResponseDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Category { get; init; } = string.Empty;
    public PaymentType PaymentType { get; init; } = PaymentType.Cash;
    public string PaymentTypeName => PaymentType == PaymentType.Card ? "Karta / Bank hisobi" : "Kassadan naqd chiqim";
    public int? CashShiftId { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime CreatedAt { get; init; }
}
