using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private readonly ICashShiftService _shiftService;

    public ShiftsController(ICashShiftService shiftService)
    {
        _shiftService = shiftService;
    }

    [HttpGet("current")]
    public async Task<ActionResult<CurrentShiftSummaryDto>> GetCurrentShift(CancellationToken ct)
    {
        var summary = await _shiftService.GetCurrentShiftAsync(ct);
        return Ok(summary);
    }

    [HttpPost("open")]
    public async Task<ActionResult<CashShiftResponseDto>> OpenShift([FromBody] OpenShiftDto dto, CancellationToken ct)
    {
        int userId = 1;
        string cashierName = "Kassir";

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
            userId = parsedId;

        var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value;
        if (!string.IsNullOrEmpty(nameClaim))
            cashierName = nameClaim;

        var shift = await _shiftService.OpenShiftAsync(userId, cashierName, dto, ct);
        return Ok(shift);
    }

    [HttpPost("close/{id:int}")]
    [HttpPost("{id:int}/close")]
    public async Task<ActionResult<CashShiftResponseDto>> CloseShift(int id, [FromBody] CloseShiftDto dto, CancellationToken ct)
    {
        var shift = await _shiftService.CloseShiftAsync(id, dto, ct);
        return Ok(shift);
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<CashShiftResponseDto>>> GetShiftHistory([FromQuery] int limit = 30, CancellationToken ct = default)
    {
        var list = await _shiftService.GetShiftHistoryAsync(limit, ct);
        return Ok(list);
    }

    [HttpPost("{id:int}/operations")]
    public async Task<ActionResult<CashOperationResponseDto>> AddOperation(int id, [FromBody] CreateCashOperationDto dto, CancellationToken ct)
    {
        string cashierName = "Kassir";
        var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value;
        if (!string.IsNullOrEmpty(nameClaim))
            cashierName = nameClaim;

        var op = await _shiftService.AddCashOperationAsync(id, dto, cashierName, ct);
        return Ok(op);
    }

    [HttpGet("{id:int}/operations")]
    public async Task<ActionResult<List<CashOperationResponseDto>>> GetOperations(int id, CancellationToken ct)
    {
        var list = await _shiftService.GetShiftOperationsAsync(id, ct);
        return Ok(list);
    }
}
