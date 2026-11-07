using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    private readonly ICurrentStoreContext? _storeContext;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        ICurrentStoreContext? storeContext = null) : base(options)
    {
        _storeContext = storeContext;
    }

    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<DebtTransaction> DebtTransactions => Set<DebtTransaction>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<User> Users => Set<User>();
    public DbSet<CashShift> CashShifts => Set<CashShift>();
    public DbSet<CashOperation> CashOperations => Set<CashOperation>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<SupplyInvoice> SupplyInvoices => Set<SupplyInvoice>();
    public DbSet<SupplyInvoiceItem> SupplyInvoiceItems => Set<SupplyInvoiceItem>();
    public DbSet<SaleRefund> SaleRefunds => Set<SaleRefund>();
    public DbSet<SaleRefundItem> SaleRefundItems => Set<SaleRefundItem>();
    public DbSet<InventoryAudit> InventoryAudits => Set<InventoryAudit>();
    public DbSet<InventoryAuditItem> InventoryAuditItems => Set<InventoryAuditItem>();
    public DbSet<SubscriptionPayment> SubscriptionPayments => Set<SubscriptionPayment>();
    public DbSet<PlatformAnnouncement> PlatformAnnouncements => Set<PlatformAnnouncement>();
    public DbSet<PlatformAuditLog> PlatformAuditLogs => Set<PlatformAuditLog>();

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return Database.BeginTransactionAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        if (_storeContext?.StoreId.HasValue == true)
        {
            var currentStoreId = _storeContext.StoreId.Value;
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Added)
                {
                    var storeIdProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "StoreId");
                    if (storeIdProp != null && (storeIdProp.CurrentValue == null || (storeIdProp.CurrentValue is int val && val == 0)))
                    {
                        storeIdProp.CurrentValue = currentStoreId;
                    }
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Multi-tenant Global Query Filters: Har bir do'kon faqat o'z ma'lumotlarini ko'radi
        modelBuilder.Entity<Product>().HasQueryFilter(p => _storeContext == null || _storeContext.StoreId == null || p.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<Customer>().HasQueryFilter(c => _storeContext == null || _storeContext.StoreId == null || c.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<Sale>().HasQueryFilter(s => _storeContext == null || _storeContext.StoreId == null || s.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<CashShift>().HasQueryFilter(cs => _storeContext == null || _storeContext.StoreId == null || cs.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<Expense>().HasQueryFilter(e => _storeContext == null || _storeContext.StoreId == null || e.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<Supplier>().HasQueryFilter(sup => _storeContext == null || _storeContext.StoreId == null || sup.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<SupplyInvoice>().HasQueryFilter(si => _storeContext == null || _storeContext.StoreId == null || si.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<DebtTransaction>().HasQueryFilter(dt => _storeContext == null || _storeContext.StoreId == null || dt.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<SaleRefund>().HasQueryFilter(sr => _storeContext == null || _storeContext.StoreId == null || sr.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<InventoryAudit>().HasQueryFilter(ia => _storeContext == null || _storeContext.StoreId == null || ia.StoreId == _storeContext.StoreId);
        modelBuilder.Entity<User>().HasQueryFilter(u => _storeContext == null || _storeContext.StoreId == null || u.StoreId == _storeContext.StoreId || u.Role == UserRole.SuperAdmin);
    }
}
