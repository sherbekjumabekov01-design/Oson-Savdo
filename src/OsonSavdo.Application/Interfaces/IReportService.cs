using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface IReportService
{
    Task<DailyReportDto> GetDailyReportAsync(DateTime date, CancellationToken ct = default);
    Task<PeriodReportDto> GetPeriodReportAsync(DateTime fromDate, DateTime toDate, CancellationToken ct = default);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default);
    Task<HourlySalesDto> GetHourlySalesAsync(DateTime? date = null, CancellationToken ct = default);
    Task<AbcAnalysisDto> GetAbcAnalysisAsync(CancellationToken ct = default);
    Task<WeeklyTrendDto> GetWeeklyTrendAsync(CancellationToken ct = default);
}
