namespace OsonSavdo.Application.DTOs;

public record DailyReportDto
{
    public DateTime Date { get; init; }
    public decimal TotalRevenue { get; init; } // Jami sotuv summasi
    public decimal CashRevenue { get; init; } // Naqd tushum
    public decimal CardRevenue { get; init; } // Karta orqali tushum
    public decimal DebtIssued { get; init; } // Berilgan qarz
    public decimal DebtCollected { get; init; } // Undirilgan qarz (RepayDebt)
    public decimal TotalCost { get; init; } // Sotilgan tovarlarning tannarxi
    public decimal GrossProfit { get; init; } // Yalpi foyda = TotalRevenue - TotalCost
    public decimal TotalExpenses { get; init; } // Xarajatlar
    public decimal NetProfit { get; init; } // Sof foyda = GrossProfit - TotalExpenses
    public int TotalSalesCount { get; init; }
}

public record PeriodReportDto
{
    public DateTime FromDate { get; init; }
    public DateTime ToDate { get; init; }
    public decimal TotalRevenue { get; init; }
    public decimal GrossProfit { get; init; }
    public decimal TotalExpenses { get; init; }
    public decimal NetProfit { get; init; }
    public int SalesCount { get; init; }
}

public record DashboardSummaryDto
{
    public decimal TodayRevenue { get; init; }
    public decimal TodayGrossProfit { get; init; }
    public decimal TodayExpenses { get; init; }
    public decimal TodayNetProfit { get; init; }
    public decimal TotalSystemDebt { get; init; } // Barcha mijozlardagi umumiy olinmagan qarz
    public int LowStockProductsCount { get; init; } // Qoldig'i kam qolgan tovarlar soni
    public int TotalCustomersCount { get; init; }
    public int TotalProductsCount { get; init; }
}

public record HourlySalesPointDto(int Hour, string HourLabel, decimal Revenue, int OrdersCount);
public record HourlySalesDto(DateTime Date, List<HourlySalesPointDto> Points, int PeakHour, decimal PeakRevenue);

public record AbcProductItemDto(
    int ProductId,
    string Name,
    string Barcode,
    string Category,
    decimal Revenue,
    decimal Profit,
    decimal QuantitySold,
    decimal RevenueSharePercent,
    decimal CumulativeSharePercent,
    string Group,
    decimal CurrentStock,
    decimal CostPrice,
    decimal SellingPrice
);

public record AbcAnalysisDto(
    List<AbcProductItemDto> Items,
    decimal TotalRevenue,
    int GroupACount,
    int GroupBCount,
    int GroupCCount,
    int DeadStockCount
);

public record WeeklyTrendPointDto(string DayLabel, DateTime Date, decimal Revenue, decimal Profit, int OrdersCount);
public record WeeklyTrendDto(List<WeeklyTrendPointDto> Points, decimal TotalWeekRevenue, decimal TotalWeekProfit);
