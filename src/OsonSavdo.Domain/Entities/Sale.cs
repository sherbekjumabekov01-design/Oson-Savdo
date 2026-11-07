using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Domain.Entities;

public class Sale
{
    public int Id { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DebtAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PaidCash { get; set; }
    public decimal PaidCard { get; set; }
    public decimal CashbackEarned { get; set; }
    public decimal CashbackUsed { get; set; }
    
    public PaymentType PaymentType { get; set; }
    public SaleStatus Status { get; set; } = SaleStatus.Completed;
    
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    
    public int? CashShiftId { get; set; }
    public CashShift? CashShift { get; set; }
    
    public string CashierName { get; set; } = "Kassir";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
    public ICollection<SaleRefund> Refunds { get; set; } = new List<SaleRefund>();
}
