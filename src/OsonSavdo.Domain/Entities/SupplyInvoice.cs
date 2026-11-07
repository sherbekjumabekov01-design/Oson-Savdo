namespace OsonSavdo.Domain.Entities;

public class SupplyInvoice
{
    public int Id { get; set; }
    public int? SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DebtAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Note { get; set; }

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public Supplier? Supplier { get; set; }
    public ICollection<SupplyInvoiceItem> Items { get; set; } = new List<SupplyInvoiceItem>();
}
