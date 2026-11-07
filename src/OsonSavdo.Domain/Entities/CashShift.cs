using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Domain.Entities;

public class CashShift
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    
    // Boshlang'ich kassa qoldig'i (mayda pul)
    public decimal OpeningBalance { get; set; }
    
    // Yopilganda kassada sanalgan naqd pul
    public decimal ClosingCashActual { get; set; }
    
    // Tizim hisoblagan kutilgan naqd pul (Boshlang'ich + Naqd savdo - Vozvratlar - Naqd xarajatlar)
    public decimal ExpectedCash { get; set; }
    
    // Farq (kamomad yoki ortiqcha pul)
    public decimal CashDifference { get; set; }
    
    // Smena davomidagi tushumlar
    public decimal TotalCashSales { get; set; }
    public decimal TotalCardSales { get; set; }
    public decimal TotalDebtSales { get; set; }
    public decimal TotalRefunds { get; set; }
    public int TotalSalesCount { get; set; }

    // Smena davomida qarzdan qabul qilingan to'lovlar
    public decimal TotalDebtRepaidCash { get; set; }
    public decimal TotalDebtRepaidCard { get; set; }

    // Smena davomida kassadan qilingan chiqimlar (xarajatlar)
    public decimal TotalExpensesCash { get; set; }

    // Kassaga pul kiritish (Vnesenie) va pul olish (Inkassatsiya)
    public decimal TotalCashIn { get; set; }
    public decimal TotalCashOut { get; set; }

    public ShiftStatus Status { get; set; } = ShiftStatus.Open;
    public string? Note { get; set; }

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public User? User { get; set; }
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
    public ICollection<DebtTransaction> DebtTransactions { get; set; } = new List<DebtTransaction>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<CashOperation> CashOperations { get; set; } = new List<CashOperation>();
}
