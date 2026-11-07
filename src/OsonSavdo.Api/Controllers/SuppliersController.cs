using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly ISupplyService _supplyService;

    public SuppliersController(ISupplyService supplyService)
    {
        _supplyService = supplyService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SupplierResponseDto>>> GetSuppliers(CancellationToken ct)
    {
        var list = await _supplyService.GetSuppliersAsync(ct);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<SupplierResponseDto>> CreateSupplier([FromBody] CreateSupplierDto dto, CancellationToken ct)
    {
        var result = await _supplyService.CreateSupplierAsync(dto, ct);
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SupplierResponseDto>> UpdateSupplier(int id, [FromBody] UpdateSupplierDto dto, CancellationToken ct)
    {
        var result = await _supplyService.UpdateSupplierAsync(id, dto, ct);
        return Ok(result);
    }

    [HttpPost("pay-debt")]
    public async Task<ActionResult<SupplierResponseDto>> PaySupplierDebt([FromBody] PaySupplierDebtDto dto, CancellationToken ct)
    {
        var result = await _supplyService.PaySupplierDebtAsync(dto, ct);
        return Ok(result);
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<List<SupplyInvoiceResponseDto>>> GetInvoices([FromQuery] int? supplierId, CancellationToken ct)
    {
        var list = await _supplyService.GetInvoicesAsync(supplierId, ct);
        return Ok(list);
    }

    [HttpPost("receive-goods")]
    public async Task<ActionResult<SupplyInvoiceResponseDto>> ReceiveGoods([FromBody] CreateSupplyInvoiceDto dto, CancellationToken ct)
    {
        var invoice = await _supplyService.ReceiveGoodsAsync(dto, ct);
        return Ok(invoice);
    }
}
