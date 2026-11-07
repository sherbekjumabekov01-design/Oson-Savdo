using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Domain.Entities;

public class Expense
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public PaymentType PaymentType { get; set; } = PaymentType.Cash;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? CashShiftId { get; set; }
    public CashShift? CashShift { get; set; }

    public int? UserId { get; set; }
    public User? User { get; set; }
    public string? CreatedByName { get; set; }

    public int? StoreId { get; set; }
    public Store? Store { get; set; }
}

