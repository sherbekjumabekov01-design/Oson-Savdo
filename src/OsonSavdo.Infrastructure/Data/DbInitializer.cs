using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        var databaseCreator = context.Database.GetService<IDatabaseCreator>() as RelationalDatabaseCreator;
        if (databaseCreator != null)
        {
            try
            {
                await databaseCreator.CreateTablesAsync();
            }
            catch
            {
                // Jadvallar allaqachon mavjud bo'lsa yoki qisman yaratilgan bo'lsa
                try
                {
                    await context.Database.EnsureCreatedAsync();
                }
                catch
                {
                }

                // Agar ba'zi jadvallar hali yaratilmagan bo'lsa (PostgreSQL / Supabase uchun har bir buyruqni alohida sinab ko'rish):
                try
                {
                    var script = context.Database.GenerateCreateScript();
                    var statements = script.Split(new[] { ";\r\n\r\n", ";\n\n", ";\r\n", ";\n" }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var stmt in statements)
                    {
                        var trimmed = stmt.Trim();
                        if (string.IsNullOrWhiteSpace(trimmed)) continue;
                        try
                        {
                            await context.Database.ExecuteSqlRawAsync(trimmed + ";");
                        }
                        catch
                        {
                            // Mavjud jadval, indeks yoki constraint xatolarini o'tkazib yuborish
                        }
                    }
                }
                catch
                {
                }
            }
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        // SQLite uchun SaaS jadvallarini va StoreId ustunlarini avtomatik tekshirish / qo'shish
        if (context.Database.IsSqlite())
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS Stores (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Name TEXT NOT NULL,
                    OwnerFullName TEXT NOT NULL,
                    Phone TEXT NOT NULL,
                    Address TEXT NULL,
                    IsActive INTEGER NOT NULL DEFAULT 1,
                    SubscriptionExpiresAt TEXT NULL,
                    MonthlyFee TEXT NOT NULL DEFAULT '150000',
                    Plan TEXT NOT NULL DEFAULT 'Standart',
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL
                );");

            var tableColumns = new[]
            {
                ("Users", "StoreId INTEGER NULL"),
                ("Products", "StoreId INTEGER NULL"),
                ("Customers", "StoreId INTEGER NULL"),
                ("Sales", "StoreId INTEGER NULL"),
                ("CashShifts", "StoreId INTEGER NULL"),
                ("Expenses", "StoreId INTEGER NULL"),
                ("Suppliers", "StoreId INTEGER NULL"),
                ("SupplyInvoices", "StoreId INTEGER NULL"),
                ("DebtTransactions", "StoreId INTEGER NULL"),
                ("SaleRefunds", "StoreId INTEGER NULL"),
                ("Products", "IsWeighted INTEGER NOT NULL DEFAULT 0"),
                ("Products", "PluCode TEXT NULL"),
                ("Products", "ExpiryDate TEXT NULL"),
                ("Customers", "CashbackBalance TEXT NOT NULL DEFAULT '0'"),
                ("Customers", "CashbackPercent TEXT NOT NULL DEFAULT '1.0'"),
                ("Stores", "TelegramBotToken TEXT NULL"),
                ("Stores", "TelegramChatId TEXT NULL"),
                ("Stores", "TelegramNotificationsEnabled INTEGER NOT NULL DEFAULT 1"),
                ("Stores", "CashbackRate TEXT NOT NULL DEFAULT '1.0'"),
                ("Stores", "EnableCashback INTEGER NOT NULL DEFAULT 1"),
                ("Stores", "ScalePrefix TEXT NOT NULL DEFAULT '21'"),
                ("Stores", "UsdRate TEXT NOT NULL DEFAULT '12850'"),
                ("Products", "IsUsdPrice INTEGER NOT NULL DEFAULT 0"),
                ("Products", "CostPriceUsd TEXT NOT NULL DEFAULT '0'"),
                ("Products", "SellingPriceUsd TEXT NOT NULL DEFAULT '0'"),
                ("Sales", "CashbackEarned TEXT NOT NULL DEFAULT '0'"),
                ("Sales", "CashbackUsed TEXT NOT NULL DEFAULT '0'"),
                ("DebtTransactions", "PaymentType INTEGER NOT NULL DEFAULT 1"),
                ("DebtTransactions", "PreviousDebt TEXT NOT NULL DEFAULT '0'"),
                ("DebtTransactions", "RemainingDebt TEXT NOT NULL DEFAULT '0'"),
                ("DebtTransactions", "CashShiftId INTEGER NULL"),
                ("DebtTransactions", "CashierName TEXT NOT NULL DEFAULT 'Kassir'"),
                ("CashShifts", "TotalDebtRepaidCash TEXT NOT NULL DEFAULT '0'"),
                ("CashShifts", "TotalDebtRepaidCard TEXT NOT NULL DEFAULT '0'"),
                ("CashShifts", "TotalExpensesCash TEXT NOT NULL DEFAULT '0'"),
                ("CashShifts", "TotalCashIn TEXT NOT NULL DEFAULT '0'"),
                ("CashShifts", "TotalCashOut TEXT NOT NULL DEFAULT '0'"),
                ("Expenses", "PaymentType INTEGER NOT NULL DEFAULT 1"),
                ("Expenses", "CashShiftId INTEGER NULL"),
                ("Expenses", "CreatedByName TEXT NULL")
            };

            foreach (var (table, colDef) in tableColumns)
            {
                try
                {
                    var sql = $"ALTER TABLE {table} ADD COLUMN {colDef};";
                    await context.Database.ExecuteSqlRawAsync(sql);
                }
                catch
                {
                    // Ustun allaqachon mavjud bo'lsa xatolik e'tiborga olinmaydi
                }
            }

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS InventoryAudits (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    AuditNumber TEXT NOT NULL,
                    CreatedAt TEXT NOT NULL,
                    CompletedAt TEXT NULL,
                    Status TEXT NOT NULL DEFAULT 'Draft',
                    CashierName TEXT NOT NULL DEFAULT 'Admin',
                    TotalExpectedQty TEXT NOT NULL DEFAULT '0',
                    TotalActualQty TEXT NOT NULL DEFAULT '0',
                    TotalDifferenceQty TEXT NOT NULL DEFAULT '0',
                    TotalDifferenceCost TEXT NOT NULL DEFAULT '0',
                    Note TEXT NULL,
                    StoreId INTEGER NULL
                );

                CREATE TABLE IF NOT EXISTS InventoryAuditItems (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    InventoryAuditId INTEGER NOT NULL,
                    ProductId INTEGER NOT NULL,
                    ProductName TEXT NOT NULL,
                    Barcode TEXT NOT NULL,
                    ExpectedQuantity TEXT NOT NULL DEFAULT '0',
                    ActualQuantity TEXT NOT NULL DEFAULT '0',
                    Difference TEXT NOT NULL DEFAULT '0',
                    CostPrice TEXT NOT NULL DEFAULT '0',
                    DifferenceCost TEXT NOT NULL DEFAULT '0',
                    FOREIGN KEY(InventoryAuditId) REFERENCES InventoryAudits(Id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS SubscriptionPayments (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    StoreId INTEGER NOT NULL,
                    StoreName TEXT NOT NULL,
                    Amount TEXT NOT NULL DEFAULT '0',
                    PaymentMethod TEXT NOT NULL DEFAULT 'Naqd',
                    DaysAdded INTEGER NOT NULL DEFAULT 30,
                    PaidAt TEXT NOT NULL,
                    ReceiptNumber TEXT NOT NULL,
                    Note TEXT NULL
                );

                CREATE TABLE IF NOT EXISTS PlatformAnnouncements (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Title TEXT NOT NULL,
                    Message TEXT NOT NULL,
                    Type TEXT NOT NULL DEFAULT 'info',
                    IsActive INTEGER NOT NULL DEFAULT 1,
                    CreatedAt TEXT NOT NULL,
                    ExpiresAt TEXT NULL
                );

                CREATE TABLE IF NOT EXISTS PlatformAuditLogs (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Action TEXT NOT NULL,
                    PerformedBy TEXT NOT NULL DEFAULT 'SuperAdmin',
                    StoreId INTEGER NULL,
                    StoreName TEXT NULL,
                    Details TEXT NOT NULL,
                    IpAddress TEXT NULL,
                    CreatedAt TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS CashOperations (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    CashShiftId INTEGER NOT NULL,
                    Type INTEGER NOT NULL,
                    Amount TEXT NOT NULL DEFAULT '0',
                    Reason TEXT NOT NULL,
                    PerformedBy TEXT NOT NULL DEFAULT 'Kassir',
                    CreatedAt TEXT NOT NULL,
                    StoreId INTEGER NULL,
                    FOREIGN KEY(CashShiftId) REFERENCES CashShifts(Id) ON DELETE CASCADE
                );");
        }
        catch
        {
            // Migratsiya xatoligi e'tiborga olinmaydi
        }
    }

        // Boshlang'ich Do'kon (Namuna) yaratish
        var defaultStore = await context.Stores.FirstOrDefaultAsync();
        if (defaultStore == null)
        {
            defaultStore = new Store
            {
                Name = "Bosh Do'kon (Namuna)",
                OwnerFullName = "Do'kon Egasi",
                Phone = "+998 90 123-45-67",
                Address = "Toshkent sh.",
                MonthlyFee = 150000m,
                Plan = "Standart",
                IsActive = true,
                SubscriptionExpiresAt = DateTime.UtcNow.AddYears(1),
                CreatedAt = DateTime.UtcNow
            };
            await context.Stores.AddAsync(defaultStore);
            await context.SaveChangesAsync();
        }

        // SuperAdmin (Platforma Egasi) foydalanuvchisini tekshirish va yaratish
        var superAdmin = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.SuperAdmin);
        if (superAdmin == null)
        {
            superAdmin = new User
            {
                Username = "superadmin",
                PasswordHash = HashPassword("super123"),
                FullName = "SaaS Platforma Egasi",
                Role = UserRole.SuperAdmin,
                StoreId = null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await context.Users.AddAsync(superAdmin);
            await context.SaveChangesAsync();
        }

        // Foydalanuvchilar (Admin va Kassir) mavjudligini tekshirish va kiritish
        if (!await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = HashPassword("admin123"),
                FullName = "Do'kon Egasi (Admin)",
                Role = UserRole.Admin,
                StoreId = defaultStore.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var cashierUser = new User
            {
                Username = "kassir",
                PasswordHash = HashPassword("kassir123"),
                FullName = "Kassir Sotuvchi",
                Role = UserRole.Cashier,
                StoreId = defaultStore.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddRangeAsync(adminUser, cashierUser);
            await context.SaveChangesAsync();
        }

        // Mavjud ma'lumotlarni boshlang'ich do'konga biriktirish (agar StoreId bo'sh bo'lsa)
        try
        {
            var sId = defaultStore.Id;
            await context.Users.IgnoreQueryFilters().Where(u => u.Role != UserRole.SuperAdmin && u.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.StoreId, sId));
            await context.Products.IgnoreQueryFilters().Where(p => p.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.StoreId, sId));
            await context.Customers.IgnoreQueryFilters().Where(c => c.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.StoreId, sId));
            await context.Sales.IgnoreQueryFilters().Where(sa => sa.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(sa => sa.StoreId, sId));
            await context.CashShifts.IgnoreQueryFilters().Where(cs => cs.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(cs => cs.StoreId, sId));
            await context.Expenses.IgnoreQueryFilters().Where(e => e.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(e => e.StoreId, sId));
            await context.Suppliers.IgnoreQueryFilters().Where(sup => sup.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(sup => sup.StoreId, sId));
            await context.SupplyInvoices.IgnoreQueryFilters().Where(si => si.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(si => si.StoreId, sId));
            await context.DebtTransactions.IgnoreQueryFilters().Where(dt => dt.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(dt => dt.StoreId, sId));
            await context.SaleRefunds.IgnoreQueryFilters().Where(sr => sr.StoreId == null)
                .ExecuteUpdateAsync(s => s.SetProperty(sr => sr.StoreId, sId));
        }
        catch
        {
        }

        // Ta'minotchilar (Postavshiklar) mavjudligini tekshirish va kiritish
        if (!await context.Suppliers.AnyAsync())
        {
            var supplier1 = new Supplier
            {
                Name = "Marqand Food Distribution",
                Phone = "+998 90 999-11-22",
                Company = "Marqand MCHJ",
                Address = "Toshkent sh., Chilonzor",
                TotalDebtToSupplier = 1200000,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            };

            var supplier2 = new Supplier
            {
                Name = "Toshkent Ichimliklar Savdo",
                Phone = "+998 97 888-33-44",
                Company = "Beverage Optom",
                Address = "Toshkent sh., Sergeli",
                TotalDebtToSupplier = 650000,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            };

            await context.Suppliers.AddRangeAsync(supplier1, supplier2);
            await context.SaveChangesAsync();
        }

        if (await context.Products.AnyAsync())
        {
            return; // Mahsulotlar allaqachon mavjud
        }

        // Boshlang'ich tovarlar
        var products = new List<Product>
        {
            new Product
            {
                Barcode = "4780012345678",
                Name = "Coca-Cola 1.5L",
                CostPrice = 10500,
                SellingPrice = 14000,
                StockQuantity = 45,
                Unit = "dona",
                MinStockAlert = 10,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Barcode = "4780087654321",
                Name = "Nestle Sut 3.2% 1L",
                CostPrice = 11000,
                SellingPrice = 14500,
                StockQuantity = 4,
                Unit = "dona",
                MinStockAlert = 8,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Barcode = "4780099887766",
                Name = "Makfa Un 1-nav 2kg",
                CostPrice = 16000,
                SellingPrice = 21000,
                StockQuantity = 3,
                Unit = "dona",
                MinStockAlert = 5,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Barcode = "4780033221144",
                Name = "Shakar (Qopda)",
                CostPrice = 9500,
                SellingPrice = 12000,
                StockQuantity = 120,
                Unit = "kg",
                MinStockAlert = 20,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Barcode = "4780055443322",
                Name = "Oloy Guruch (Lazer)",
                CostPrice = 22000,
                SellingPrice = 28000,
                StockQuantity = 65,
                Unit = "kg",
                MinStockAlert = 15,
                CreatedAt = DateTime.UtcNow
            }
        };

        // Boshlang'ich mijozlar
        var customer1 = new Customer
        {
            FullName = "Anvar Qodirov",
            Phone = "+998 90 123-45-67",
            TotalDebt = 345000,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };

        var customer2 = new Customer
        {
            FullName = "Dilshod Raximov",
            Phone = "+998 93 987-65-43",
            TotalDebt = 780000,
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };

        var customer3 = new Customer
        {
            FullName = "Sherzod Aliyev",
            Phone = "+998 97 555-11-22",
            TotalDebt = 125000,
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        };

        // Boshlang'ich xarajatlar
        var expenses = new List<Expense>
        {
            new Expense
            {
                Title = "Do'kon oylik ijarasi",
                Amount = 3500000,
                Category = "Ijara",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Expense
            {
                Title = "Elektr energiyasi to'lovi",
                Amount = 420000,
                Category = "Kommunal",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        await context.Products.AddRangeAsync(products);
        await context.Customers.AddRangeAsync(customer1, customer2, customer3);
        await context.Expenses.AddRangeAsync(expenses);
        await context.SaveChangesAsync();

        // Nasiya tranzaksiyalari
        var tx1 = new DebtTransaction
        {
            CustomerId = customer1.Id,
            Amount = 345000,
            Type = TransactionType.TakeDebt,
            Note = "Savdo bo'yicha nasiya",
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        var tx2 = new DebtTransaction
        {
            CustomerId = customer2.Id,
            Amount = 780000,
            Type = TransactionType.TakeDebt,
            Note = "Savdo bo'yicha nasiya",
            CreatedAt = DateTime.UtcNow.AddDays(-4)
        };

        await context.DebtTransactions.AddRangeAsync(tx1, tx2);
        await context.SaveChangesAsync();
    }

    public static string HashPassword(string password)
    {
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = System.Text.Encoding.UTF8.GetBytes(password);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}
