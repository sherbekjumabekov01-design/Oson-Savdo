namespace OsonSavdo.Domain.Entities;

public class InventoryAuditItem
{
    public int Id { get; set; }
    public int InventoryAuditId { get; set; }
    public InventoryAudit? InventoryAudit { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public decimal ExpectedQuantity { get; set; }
    public decimal ActualQuantity { get; set; }
    public decimal Difference { get; set; }
    public decimal CostPrice { get; set; }
    public decimal DifferenceCost { get; set; }
}
