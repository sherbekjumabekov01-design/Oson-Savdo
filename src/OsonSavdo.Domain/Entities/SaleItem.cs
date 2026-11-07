namespace OsonSavdo.Domain.Entities;

public class SaleItem
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public Sale Sale { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal UnitCostPrice { get; set; }
    public decimal UnitSellingPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal RefundedQuantity { get; set; }
}
