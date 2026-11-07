using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Store> Stores { get; }
    DbSet<Product> Products { get; }
    DbSet<Customer> Customers { get; }
    DbSet<Sale> Sales { get; }
    DbSet<SaleItem> SaleItems { get; }
    DbSet<DebtTransaction> DebtTransactions { get; }
    DbSet<Expense> Expenses { get; }
    DbSet<User> Users { get; }
    DbSet<CashShift> CashShifts { get; }
    DbSet<CashOperation> CashOperations { get; }
    DbSet<Supplier> Suppliers { get; }
    DbSet<SupplyInvoice> SupplyInvoices { get; }
    DbSet<SupplyInvoiceItem> SupplyInvoiceItems { get; }
    DbSet<SaleRefund> SaleRefunds { get; }
    DbSet<SaleRefundItem> SaleRefundItems { get; }
    DbSet<InventoryAudit> InventoryAudits { get; }
    DbSet<InventoryAuditItem> InventoryAuditItems { get; }
    DbSet<SubscriptionPayment> SubscriptionPayments { get; }
    DbSet<PlatformAnnouncement> PlatformAnnouncements { get; }
    DbSet<PlatformAuditLog> PlatformAuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
