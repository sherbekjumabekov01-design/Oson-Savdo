namespace OsonSavdo.Domain.Entities;

public class Store
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string OwnerFullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? SubscriptionExpiresAt { get; set; }
    public decimal MonthlyFee { get; set; } = 150000m;
    public string Plan { get; set; } = "Standart";
    public string? TelegramBotToken { get; set; }
    public string? TelegramChatId { get; set; }
    public bool TelegramNotificationsEnabled { get; set; } = true;
    public decimal CashbackRate { get; set; } = 1.0m;
    public bool EnableCashback { get; set; } = true;
    public string ScalePrefix { get; set; } = "21";
    public decimal UsdRate { get; set; } = 12850m;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
    public ICollection<CashShift> CashShifts { get; set; } = new List<CashShift>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
    public ICollection<InventoryAudit> InventoryAudits { get; set; } = new List<InventoryAudit>();
}
