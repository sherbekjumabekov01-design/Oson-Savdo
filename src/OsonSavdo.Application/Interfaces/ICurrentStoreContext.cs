namespace OsonSavdo.Application.Interfaces;

public interface ICurrentStoreContext
{
    int? StoreId { get; }
    string? Role { get; }
    bool IsSuperAdmin { get; }
}
