using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Cashier;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public ICollection<CashShift> CashShifts { get; set; } = new List<CashShift>();
}

