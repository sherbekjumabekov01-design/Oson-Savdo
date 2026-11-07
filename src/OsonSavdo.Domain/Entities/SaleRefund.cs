namespace OsonSavdo.Domain.Entities;

public class SaleRefund
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public decimal TotalRefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? StoreId { get; set; }

    public Sale? Sale { get; set; }
    public ICollection<SaleRefundItem> Items { get; set; } = new List<SaleRefundItem>();
}
