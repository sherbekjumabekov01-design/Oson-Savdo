using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExpenseResponseDto>>> GetAll(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? category = null,
        CancellationToken ct = default)
    {
        var expenses = await _expenseService.GetAllAsync(fromDate, toDate, category, ct);
        return Ok(expenses);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ExpenseResponseDto>> GetById(int id, CancellationToken ct = default)
    {
        var expense = await _expenseService.GetByIdAsync(id, ct);
        return Ok(expense);
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseResponseDto>> Create([FromBody] CreateExpenseDto dto, CancellationToken ct = default)
    {
        int? userId = null;
        string? cashierName = dto.CreatedByName;

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
            userId = parsedId;

        var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value;
        if (!string.IsNullOrEmpty(nameClaim))
            cashierName = nameClaim;

        var created = await _expenseService.CreateAsync(dto, userId, cashierName, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _expenseService.DeleteAsync(id, ct);
        return NoContent();
    }
}
