using System.ComponentModel.DataAnnotations;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Application.DTOs;

public record RepayDebtDto
{
    [Required(ErrorMessage = "Mijoz ID kiritilishi shart")]
    public int CustomerId { get; init; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "To'lov summasi 0 dan katta bo'lishi kerak")]
    public decimal Amount { get; init; }

    public PaymentType PaymentType { get; init; } = PaymentType.Cash;

    public int? CashShiftId { get; init; }

    public string? CashierName { get; init; }

    public string? Note { get; init; }
}

public record DebtTransactionResponseDto
{
    public int Id { get; init; }
    public int CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public TransactionType Type { get; init; }
    public PaymentType PaymentType { get; init; } = PaymentType.Cash;
    public decimal PreviousDebt { get; init; }
    public decimal RemainingDebt { get; init; }
    public int? CashShiftId { get; init; }
    public string CashierName { get; init; } = "Kassir";
    public string? Note { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CustomerDebtSummaryDto
{
    public int CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public decimal TotalDebt { get; init; }
    public DateTime? LastTransactionDate { get; init; }
}
