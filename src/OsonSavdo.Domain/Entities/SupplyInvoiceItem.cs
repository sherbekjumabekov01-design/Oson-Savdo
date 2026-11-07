namespace OsonSavdo.Domain.Entities;

public class SupplyInvoiceItem
{
    public int Id { get; set; }
    public int SupplyInvoiceId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal CostPrice { get; set; } // Kelish narxi
    public decimal SellingPrice { get; set; } // Sotish narxi
    public decimal Subtotal => Quantity * CostPrice;

    public SupplyInvoice? SupplyInvoice { get; set; }
    public Product? Product { get; set; }
}
