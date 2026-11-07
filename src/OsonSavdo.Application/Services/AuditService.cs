using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class AuditService : IAuditService
{
    private readonly IAppDbContext _db;

    public AuditService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<InventoryAuditResponseDto>> GetAuditsAsync(CancellationToken ct = default)
    {
        var audits = await _db.InventoryAudits
            .AsNoTracking()
            .Include(a => a.Items)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

        return audits.Select(MapToDto).ToList();
    }

    public async Task<InventoryAuditResponseDto> GetAuditByIdAsync(int id, CancellationToken ct = default)
    {
        var audit = await _db.InventoryAudits
            .AsNoTracking()
            .Include(a => a.Items)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (audit == null)
            throw new NotFoundException($"ID: {id} bo'lgan inventarizatsiya hujjati topilmadi.");

        return MapToDto(audit);
    }

    public async Task<InventoryAuditResponseDto> CreateAuditAsync(string cashierName, CreateInventoryAuditDto dto, CancellationToken ct = default)
    {
        var products = await _db.Products
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

        var auditNumber = $"REV-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        var audit = new InventoryAudit
        {
            AuditNumber = auditNumber,
            CreatedAt = DateTime.UtcNow,
            Status = "Draft",
            CashierName = string.IsNullOrWhiteSpace(cashierName) ? "Admin" : cashierName,
            Note = dto.Note
        };

        var itemsMap = dto.Items?.ToDictionary(i => i.ProductId, i => i.ActualQuantity) ?? new Dictionary<int, decimal>();

        foreach (var p in products)
        {
            var actualQty = itemsMap.TryGetValue(p.Id, out var qty) ? qty : p.StockQuantity;
            var diff = actualQty - p.StockQuantity;
            var diffCost = diff * p.CostPrice;

            audit.Items.Add(new InventoryAuditItem
            {
                ProductId = p.Id,
                ProductName = p.Name,
                Barcode = p.Barcode,
                ExpectedQuantity = p.StockQuantity,
                ActualQuantity = actualQty,
                Difference = diff,
                CostPrice = p.CostPrice,
                DifferenceCost = diffCost
            });
        }

        audit.TotalExpectedQty = audit.Items.Sum(i => i.ExpectedQuantity);
        audit.TotalActualQty = audit.Items.Sum(i => i.ActualQuantity);
        audit.TotalDifferenceQty = audit.Items.Sum(i => i.Difference);
        audit.TotalDifferenceCost = audit.Items.Sum(i => i.DifferenceCost);

        _db.InventoryAudits.Add(audit);
        await _db.SaveChangesAsync(ct);

        return MapToDto(audit);
    }

    public async Task<InventoryAuditResponseDto> UpdateAuditItemAsync(int auditId, UpdateAuditItemDto dto, CancellationToken ct = default)
    {
        var audit = await _db.InventoryAudits
            .Include(a => a.Items)
            .FirstOrDefaultAsync(a => a.Id == auditId, ct);

        if (audit == null)
            throw new NotFoundException($"ID: {auditId} bo'lgan reviziya topilmadi.");

        if (audit.Status == "Completed")
            throw new BusinessException("Yakunlangan reviziyani tahrirlab bo'lmaydi.");

        var item = audit.Items.FirstOrDefault(i => i.ProductId == dto.ProductId);
        if (item == null)
            throw new NotFoundException("Reviziya ro'yxatida ushbu tovar topilmadi.");

        item.ActualQuantity = dto.ActualQuantity;
        item.Difference = item.ActualQuantity - item.ExpectedQuantity;
        item.DifferenceCost = item.Difference * item.CostPrice;

        audit.TotalActualQty = audit.Items.Sum(i => i.ActualQuantity);
        audit.TotalDifferenceQty = audit.Items.Sum(i => i.Difference);
        audit.TotalDifferenceCost = audit.Items.Sum(i => i.DifferenceCost);

        await _db.SaveChangesAsync(ct);

        return MapToDto(audit);
    }

    public async Task<InventoryAuditResponseDto> CompleteAuditAsync(int auditId, CancellationToken ct = default)
    {
        var audit = await _db.InventoryAudits
            .Include(a => a.Items)
            .FirstOrDefaultAsync(a => a.Id == auditId, ct);

        if (audit == null)
            throw new NotFoundException($"ID: {auditId} bo'lgan reviziya topilmadi.");

        if (audit.Status == "Completed")
            throw new BusinessException("Ushbu reviziya allaqachon yakunlangan.");

        // Qoldiqlarni yangilash
        var productIds = audit.Items.Select(i => i.ProductId).ToList();
        var products = await _db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync(ct);

        foreach (var p in products)
        {
            var auditItem = audit.Items.FirstOrDefault(i => i.ProductId == p.Id);
            if (auditItem != null)
            {
                p.StockQuantity = auditItem.ActualQuantity;
                p.UpdatedAt = DateTime.UtcNow;
            }
        }

        audit.Status = "Completed";
        audit.CompletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return MapToDto(audit);
    }

    private static InventoryAuditResponseDto MapToDto(InventoryAudit a)
    {
        return new InventoryAuditResponseDto(
            Id: a.Id,
            AuditNumber: a.AuditNumber,
            CreatedAt: a.CreatedAt,
            CompletedAt: a.CompletedAt,
            Status: a.Status,
            CashierName: a.CashierName,
            TotalExpectedQty: a.TotalExpectedQty,
            TotalActualQty: a.TotalActualQty,
            TotalDifferenceQty: a.TotalDifferenceQty,
            TotalDifferenceCost: a.TotalDifferenceCost,
            Note: a.Note,
            Items: a.Items.Select(i => new InventoryAuditItemDto(
                Id: i.Id,
                ProductId: i.ProductId,
                ProductName: i.ProductName,
                Barcode: i.Barcode,
                ExpectedQuantity: i.ExpectedQuantity,
                ActualQuantity: i.ActualQuantity,
                Difference: i.Difference,
                CostPrice: i.CostPrice,
                DifferenceCost: i.DifferenceCost
            )).ToList()
        );
    }
}
