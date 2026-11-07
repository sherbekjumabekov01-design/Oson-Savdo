namespace OsonSavdo.Domain.Entities;

public class Product
{
    public int Id { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal StockQuantity { get; set; }
    public string Unit { get; set; } = "dona";
    public string Category { get; set; } = "Umumiy";
    public decimal MinStockAlert { get; set; } = 5;
    public bool IsWeighted { get; set; } = false;
    public string? PluCode { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsUsdPrice { get; set; } = false;
    public decimal CostPriceUsd { get; set; }
    public decimal SellingPriceUsd { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
}
