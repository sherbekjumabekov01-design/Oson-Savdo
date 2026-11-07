using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebtsController : ControllerBase
{
    private readonly IDebtService _debtService;

    public DebtsController(IDebtService debtService)
    {
        _debtService = debtService;
    }

    [HttpPost("repay")]
    public async Task<ActionResult<DebtTransactionResponseDto>> RepayDebt([FromBody] RepayDebtDto dto, CancellationToken ct = default)
    {
        var result = await _debtService.RepayDebtAsync(dto, ct);
        return Ok(result);
    }

    [HttpGet("debtors")]
    public async Task<ActionResult<IEnumerable<CustomerDebtSummaryDto>>> GetAllDebtors(CancellationToken ct = default)
    {
        var debtors = await _debtService.GetAllDebtorsAsync(ct);
        return Ok(debtors);
    }

    [HttpGet("customer/{customerId:int}/summary")]
    public async Task<ActionResult<CustomerDebtSummaryDto>> GetCustomerDebtSummary(int customerId, CancellationToken ct = default)
    {
        var summary = await _debtService.GetCustomerDebtSummaryAsync(customerId, ct);
        return Ok(summary);
    }

    [HttpGet("customer/{customerId:int}/transactions")]
    public async Task<ActionResult<IEnumerable<DebtTransactionResponseDto>>> GetCustomerTransactions(int customerId, CancellationToken ct = default)
    {
        var transactions = await _debtService.GetCustomerTransactionsAsync(customerId, ct);
        return Ok(transactions);
    }
}
