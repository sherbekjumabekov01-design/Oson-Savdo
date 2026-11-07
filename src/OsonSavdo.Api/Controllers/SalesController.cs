using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ISaleService _saleService;
    private readonly IRefundService _refundService;

    public SalesController(ISaleService saleService, IRefundService refundService)
    {
        _saleService = saleService;
        _refundService = refundService;
    }

    [HttpPost]
    public async Task<ActionResult<SaleResponseDto>> ProcessSale([FromBody] CreateSaleDto dto, CancellationToken ct = default)
    {
        var result = await _saleService.ProcessSaleAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SaleResponseDto>> GetById(int id, CancellationToken ct = default)
    {
        var sale = await _saleService.GetByIdAsync(id, ct);
        return Ok(sale);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SaleResponseDto>>> GetSales(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int? customerId = null,
        CancellationToken ct = default)
    {
        var sales = await _saleService.GetSalesAsync(fromDate, toDate, customerId, ct);
        return Ok(sales);
    }

    [HttpPost("refund")]
    public async Task<ActionResult<SaleRefundResponseDto>> ProcessRefund([FromBody] CreateRefundDto dto, CancellationToken ct = default)
    {
        var result = await _refundService.ProcessRefundAsync(dto, ct);
        return Ok(result);
    }

    [HttpGet("refunds")]
    public async Task<ActionResult<List<SaleRefundResponseDto>>> GetRefunds([FromQuery] int? saleId, CancellationToken ct = default)
    {
        var refunds = await _refundService.GetRefundsAsync(saleId, ct);
        return Ok(refunds);
    }
}
