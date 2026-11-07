namespace OsonSavdo.Domain.Entities;

public class PlatformAuditLog
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = "SuperAdmin";
    public int? StoreId { get; set; }
    public string? StoreName { get; set; }
    public string Details { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
