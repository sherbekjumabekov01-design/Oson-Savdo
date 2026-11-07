namespace OsonSavdo.Domain.Entities;

public class SaleRefundItem
{
    public int Id { get; set; }
    public int SaleRefundId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal RefundUnitPrice { get; set; }
    public decimal Subtotal => Quantity * RefundUnitPrice;

    public SaleRefund? SaleRefund { get; set; }
    public Product? Product { get; set; }
}
