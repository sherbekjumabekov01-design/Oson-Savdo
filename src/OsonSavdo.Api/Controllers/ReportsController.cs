using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("daily")]
    public async Task<ActionResult<DailyReportDto>> GetDailyReport([FromQuery] DateTime? date = null, CancellationToken ct = default)
    {
        var targetDate = date ?? DateTime.UtcNow.Date;
        var report = await _reportService.GetDailyReportAsync(targetDate, ct);
        return Ok(report);
    }

    [HttpGet("period")]
    public async Task<ActionResult<PeriodReportDto>> GetPeriodReport(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        CancellationToken ct = default)
    {
        var report = await _reportService.GetPeriodReportAsync(fromDate, toDate, ct);
        return Ok(report);
    }

    [HttpGet("dashboard")]
    [HttpGet("dashboard-summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboardSummary(CancellationToken ct = default)
    {
        var summary = await _reportService.GetDashboardSummaryAsync(ct);
        return Ok(summary);
    }

    [HttpGet("hourly")]
    public async Task<ActionResult<HourlySalesDto>> GetHourlySales([FromQuery] DateTime? date = null, CancellationToken ct = default)
    {
        var result = await _reportService.GetHourlySalesAsync(date, ct);
        return Ok(result);
    }

    [HttpGet("abc")]
    public async Task<ActionResult<AbcAnalysisDto>> GetAbcAnalysis(CancellationToken ct = default)
    {
        var result = await _reportService.GetAbcAnalysisAsync(ct);
        return Ok(result);
    }

    [HttpGet("weekly-trend")]
    public async Task<ActionResult<WeeklyTrendDto>> GetWeeklyTrend(CancellationToken ct = default)
    {
        var result = await _reportService.GetWeeklyTrendAsync(ct);
        return Ok(result);
    }
}
