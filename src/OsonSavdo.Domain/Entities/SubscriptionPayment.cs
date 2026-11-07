namespace OsonSavdo.Domain.Entities;

public class SubscriptionPayment
{
    public int Id { get; set; }
    public int StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Naqd"; // Naqd, Click, Payme, Hisob-raqam (Perechislenie), Karta
    public int DaysAdded { get; set; } = 30;
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public string ReceiptNumber { get; set; } = string.Empty;
    public string? Note { get; set; }

    public Store? Store { get; set; }
}
