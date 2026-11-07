namespace OsonSavdo.Domain.Entities;

public enum CashOperationType
{
    CashIn = 1,  // Kassaga pul kiritish (mayda pul, to'ldirish)
    CashOut = 2  // Kassadan pul olish (inkassatsiya, xo'jayin olib ketishi)
}

public class CashOperation
{
    public int Id { get; set; }
    public int CashShiftId { get; set; }
    public CashShift? CashShift { get; set; }
    public CashOperationType Type { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = "Kassir";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int? StoreId { get; set; }
    public Store? Store { get; set; }
}

