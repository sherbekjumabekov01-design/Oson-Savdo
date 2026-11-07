namespace OsonSavdo.Domain.Entities;

public class InventoryAudit
{
    public int Id { get; set; }
    public string AuditNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Completed, Cancelled
    public string CashierName { get; set; } = "Admin";
    public decimal TotalExpectedQty { get; set; }
    public decimal TotalActualQty { get; set; }
    public decimal TotalDifferenceQty { get; set; }
    public decimal TotalDifferenceCost { get; set; }
    public string? Note { get; set; }

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public ICollection<InventoryAuditItem> Items { get; set; } = new List<InventoryAuditItem>();
}
