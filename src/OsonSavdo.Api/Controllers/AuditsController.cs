using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditsController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditsController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<List<InventoryAuditResponseDto>>> GetAudits(CancellationToken ct)
    {
        var list = await _auditService.GetAuditsAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InventoryAuditResponseDto>> GetAuditById(int id, CancellationToken ct)
    {
        var audit = await _auditService.GetAuditByIdAsync(id, ct);
        return Ok(audit);
    }

    [HttpPost]
    public async Task<ActionResult<InventoryAuditResponseDto>> CreateAudit([FromBody] CreateInventoryAuditDto dto, CancellationToken ct)
    {
        var cashierName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Admin";
        var audit = await _auditService.CreateAuditAsync(cashierName, dto, ct);
        return CreatedAtAction(nameof(GetAuditById), new { id = audit.Id }, audit);
    }

    [HttpPut("{id:int}/item")]
    public async Task<ActionResult<InventoryAuditResponseDto>> UpdateAuditItem(int id, [FromBody] UpdateAuditItemDto dto, CancellationToken ct)
    {
        var audit = await _auditService.UpdateAuditItemAsync(id, dto, ct);
        return Ok(audit);
    }

    [HttpPost("{id:int}/complete")]
    public async Task<ActionResult<InventoryAuditResponseDto>> CompleteAudit(int id, CancellationToken ct)
    {
        var audit = await _auditService.CompleteAuditAsync(id, ct);
        return Ok(audit);
    }
}
