using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;

namespace OsonSavdo.Application.Services;

public class ReportService : IReportService
{
    private readonly IAppDbContext _db;

    public ReportService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<DailyReportDto> GetDailyReportAsync(DateTime date, CancellationToken ct = default)
    {
        var startUtc = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var endUtc = startUtc.AddDays(1).AddTicks(-1);

        // Kunlik savdolarni yuklash
        var sales = await _db.Sales
            .AsNoTracking()
            .Include(s => s.Items)
            .Where(s => s.CreatedAt >= startUtc && s.CreatedAt <= endUtc)
            .ToListAsync(ct);

        // Kunlik to'langan qarzlarni yuklash
        var debtCollectedAmounts = await _db.DebtTransactions
            .AsNoTracking()
            .Where(t => t.Type == TransactionType.RepayDebt && t.CreatedAt >= startUtc && t.CreatedAt <= endUtc)
            .Select(t => t.Amount)
            .ToListAsync(ct);
        decimal debtCollected = debtCollectedAmounts.Sum();

        // Kunlik xarajatlarni yuklash
        var expenseAmounts = await _db.Expenses
            .AsNoTracking()
            .Where(e => e.CreatedAt >= startUtc && e.CreatedAt <= endUtc)
            .Select(e => e.Amount)
            .ToListAsync(ct);
        decimal totalExpenses = expenseAmounts.Sum();

        decimal totalRevenue = sales.Sum(s => s.TotalAmount);
        decimal cashRevenue = sales.Where(s => s.PaymentType == PaymentType.Cash).Sum(s => s.PaidAmount);
        decimal cardRevenue = sales.Where(s => s.PaymentType == PaymentType.Card).Sum(s => s.PaidAmount);
        decimal mixedPaid = sales.Where(s => s.PaymentType == PaymentType.Mixed).Sum(s => s.PaidAmount);
        decimal debtIssued = sales.Sum(s => s.DebtAmount);

        // Yalpi foyda hisobi: (UnitSellingPrice - UnitCostPrice) * Quantity
        decimal totalCost = 0;
        decimal grossProfit = 0;

        foreach (var sale in sales)
        {
            foreach (var item in sale.Items)
            {
                totalCost += item.Quantity * item.UnitCostPrice;
                grossProfit += (item.UnitSellingPrice - item.UnitCostPrice) * item.Quantity;
            }
        }

        decimal netProfit = grossProfit - totalExpenses;

        return new DailyReportDto
        {
            Date = startUtc,
            TotalRevenue = totalRevenue,
            CashRevenue = cashRevenue + mixedPaid,
            CardRevenue = cardRevenue,
            DebtIssued = debtIssued,
            DebtCollected = debtCollected,
            TotalCost = totalCost,
            GrossProfit = grossProfit,
            TotalExpenses = totalExpenses,
            NetProfit = netProfit,
            TotalSalesCount = sales.Count
        };
    }

    public async Task<PeriodReportDto> GetPeriodReportAsync(DateTime fromDate, DateTime toDate, CancellationToken ct = default)
    {
        var startUtc = DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(toDate.Date, DateTimeKind.Utc).AddDays(1).AddTicks(-1);

        var sales = await _db.Sales
            .AsNoTracking()
            .Include(s => s.Items)
            .Where(s => s.CreatedAt >= startUtc && s.CreatedAt <= endUtc)
            .ToListAsync(ct);

        var expenseAmounts = await _db.Expenses
            .AsNoTracking()
            .Where(e => e.CreatedAt >= startUtc && e.CreatedAt <= endUtc)
            .Select(e => e.Amount)
            .ToListAsync(ct);
        decimal totalExpenses = expenseAmounts.Sum();

        decimal totalRevenue = sales.Sum(s => s.TotalAmount);
        decimal grossProfit = 0;

        foreach (var sale in sales)
        {
            foreach (var item in sale.Items)
            {
                grossProfit += (item.UnitSellingPrice - item.UnitCostPrice) * item.Quantity;
            }
        }

        return new PeriodReportDto
        {
            FromDate = startUtc,
            ToDate = endUtc,
            TotalRevenue = totalRevenue,
            GrossProfit = grossProfit,
            TotalExpenses = totalExpenses,
            NetProfit = grossProfit - totalExpenses,
            SalesCount = sales.Count
        };
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var dailyReport = await GetDailyReportAsync(today, ct);

        var debtAmounts = await _db.Customers
            .AsNoTracking()
            .Select(c => c.TotalDebt)
            .ToListAsync(ct);
        decimal totalDebt = debtAmounts.Sum();

        var lowStockCount = await _db.Products
            .AsNoTracking()
            .CountAsync(p => p.StockQuantity <= p.MinStockAlert, ct);

        var customersCount = await _db.Customers
            .AsNoTracking()
            .CountAsync(ct);

        var productsCount = await _db.Products
            .AsNoTracking()
            .CountAsync(ct);

        return new DashboardSummaryDto
        {
            TodayRevenue = dailyReport.TotalRevenue,
            TodayGrossProfit = dailyReport.GrossProfit,
            TodayExpenses = dailyReport.TotalExpenses,
            TodayNetProfit = dailyReport.NetProfit,
            TotalSystemDebt = totalDebt,
            LowStockProductsCount = lowStockCount,
            TotalCustomersCount = customersCount,
            TotalProductsCount = productsCount
        };
    }

    public async Task<HourlySalesDto> GetHourlySalesAsync(DateTime? date = null, CancellationToken ct = default)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;
        var startUtc = DateTime.SpecifyKind(targetDate, DateTimeKind.Utc);
        var endUtc = startUtc.AddDays(1).AddTicks(-1);

        var sales = await _db.Sales
            .AsNoTracking()
            .Where(s => s.CreatedAt >= startUtc && s.CreatedAt <= endUtc && s.Status != SaleStatus.Refunded)
            .ToListAsync(ct);

        var points = new List<HourlySalesPointDto>();
        int peakHour = 12;
        decimal peakRevenue = 0;

        for (int h = 8; h <= 23; h++)
        {
            var hourSales = sales.Where(s => s.CreatedAt.Hour == h).ToList();
            var rev = hourSales.Sum(s => s.TotalAmount);
            var count = hourSales.Count;

            if (rev > peakRevenue)
            {
                peakRevenue = rev;
                peakHour = h;
            }

            points.Add(new HourlySalesPointDto(
                Hour: h,
                HourLabel: $"{h:00}:00",
                Revenue: rev,
                OrdersCount: count
            ));
        }

        return new HourlySalesDto(targetDate, points, peakHour, peakRevenue);
    }

    public async Task<AbcAnalysisDto> GetAbcAnalysisAsync(CancellationToken ct = default)
    {
        var products = await _db.Products
            .AsNoTracking()
            .Include(p => p.SaleItems)
            .ToListAsync(ct);

        var totalSystemRevenue = products.Sum(p => p.SaleItems.Sum(si => si.Quantity * si.UnitSellingPrice));

        var items = new List<AbcProductItemDto>();
        var activeProducts = new List<(Product Product, decimal Revenue, decimal Profit, decimal Qty)>();

        foreach (var p in products)
        {
            var rev = p.SaleItems.Sum(si => si.Quantity * si.UnitSellingPrice);
            var cost = p.SaleItems.Sum(si => si.Quantity * si.UnitCostPrice);
            var qty = p.SaleItems.Sum(si => si.Quantity);
            var profit = rev - cost;

            if (rev == 0)
            {
                // Sotilmagan tovar (Dead stock)
                items.Add(new AbcProductItemDto(
                    ProductId: p.Id,
                    Name: p.Name,
                    Barcode: p.Barcode,
                    Category: p.Category,
                    Revenue: 0,
                    Profit: 0,
                    QuantitySold: 0,
                    RevenueSharePercent: 0,
                    CumulativeSharePercent: 100,
                    Group: "DeadStock",
                    CurrentStock: p.StockQuantity,
                    CostPrice: p.CostPrice,
                    SellingPrice: p.SellingPrice
                ));
            }
            else
            {
                activeProducts.Add((p, rev, profit, qty));
            }
        }

        var sortedActive = activeProducts.OrderByDescending(x => x.Revenue).ToList();
        decimal cumulativeRev = 0;
        int groupACount = 0;
        int groupBCount = 0;
        int groupCCount = 0;

        foreach (var x in sortedActive)
        {
            cumulativeRev += x.Revenue;
            var share = totalSystemRevenue > 0 ? (x.Revenue / totalSystemRevenue) * 100m : 0;
            var cumulativeShare = totalSystemRevenue > 0 ? (cumulativeRev / totalSystemRevenue) * 100m : 0;

            string group;
            if (cumulativeShare <= 80m || groupACount == 0)
            {
                group = "A";
                groupACount++;
            }
            else if (cumulativeShare <= 95m)
            {
                group = "B";
                groupBCount++;
            }
            else
            {
                group = "C";
                groupCCount++;
            }

            items.Add(new AbcProductItemDto(
                ProductId: x.Product.Id,
                Name: x.Product.Name,
                Barcode: x.Product.Barcode,
                Category: x.Product.Category,
                Revenue: Math.Round(x.Revenue, 2),
                Profit: Math.Round(x.Profit, 2),
                QuantitySold: x.Qty,
                RevenueSharePercent: Math.Round(share, 1),
                CumulativeSharePercent: Math.Round(cumulativeShare, 1),
                Group: group,
                CurrentStock: x.Product.StockQuantity,
                CostPrice: x.Product.CostPrice,
                SellingPrice: x.Product.SellingPrice
            ));
        }

        int deadStockCount = items.Count(i => i.Group == "DeadStock");

        return new AbcAnalysisDto(
            Items: items,
            TotalRevenue: Math.Round(totalSystemRevenue, 2),
            GroupACount: groupACount,
            GroupBCount: groupBCount,
            GroupCCount: groupCCount,
            DeadStockCount: deadStockCount
        );
    }

    public async Task<WeeklyTrendDto> GetWeeklyTrendAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var sevenDaysAgo = today.AddDays(-6);
        var startUtc = DateTime.SpecifyKind(sevenDaysAgo, DateTimeKind.Utc);

        var sales = await _db.Sales
            .AsNoTracking()
            .Include(s => s.Items)
            .Where(s => s.CreatedAt >= startUtc && s.Status != SaleStatus.Refunded)
            .ToListAsync(ct);

        var points = new List<WeeklyTrendPointDto>();
        decimal weekTotalRevenue = 0;
        decimal weekTotalProfit = 0;

        string[] uzbekDayNames = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Juma", "Shan"];

        for (int i = 6; i >= 0; i--)
        {
            var day = today.AddDays(-i);
            var dayStart = DateTime.SpecifyKind(day, DateTimeKind.Utc);
            var dayEnd = dayStart.AddDays(1).AddTicks(-1);

            var daySales = sales.Where(s => s.CreatedAt >= dayStart && s.CreatedAt <= dayEnd).ToList();
            var rev = daySales.Sum(s => s.TotalAmount);
            var cost = daySales.Sum(s => s.Items.Sum(item => item.Quantity * item.UnitCostPrice));
            var profit = rev - cost;
            var orders = daySales.Count;

            weekTotalRevenue += rev;
            weekTotalProfit += profit;

            var dayOfWeekIndex = (int)day.DayOfWeek;
            var label = $"{uzbekDayNames[dayOfWeekIndex]} ({day:dd.MM})";

            points.Add(new WeeklyTrendPointDto(label, day, rev, profit, orders));
        }

        return new WeeklyTrendDto(points, weekTotalRevenue, weekTotalProfit);
    }
}

