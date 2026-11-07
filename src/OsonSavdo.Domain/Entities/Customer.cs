namespace OsonSavdo.Domain.Entities;

public class Customer
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public decimal TotalDebt { get; set; }
    public decimal CashbackBalance { get; set; } = 0;
    public decimal CashbackPercent { get; set; } = 1.0m;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
    public ICollection<DebtTransaction> DebtTransactions { get; set; } = new List<DebtTransaction>();
}
