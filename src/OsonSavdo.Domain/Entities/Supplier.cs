namespace OsonSavdo.Domain.Entities;

public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string? Address { get; set; }
    public decimal TotalDebtToSupplier { get; set; } // Bizning ta'minotchiga qarzimiz
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public ICollection<SupplyInvoice> Invoices { get; set; } = new List<SupplyInvoice>();
}
