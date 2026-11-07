using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Domain.Entities;

public class DebtTransaction
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public PaymentType PaymentType { get; set; } = PaymentType.Cash;
    public decimal PreviousDebt { get; set; }
    public decimal RemainingDebt { get; set; }
    public int? CashShiftId { get; set; }
    public CashShift? CashShift { get; set; }
    public string CashierName { get; set; } = "Kassir";
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? StoreId { get; set; }
}
