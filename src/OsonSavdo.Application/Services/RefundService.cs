using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class RefundService : IRefundService
{
    private readonly IAppDbContext _db;

    public RefundService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<SaleRefundResponseDto> ProcessRefundAsync(CreateRefundDto dto, CancellationToken ct = default)
    {
        if (dto.Items == null || !dto.Items.Any())
            throw new BusinessException("Qaytarish uchun kamida bitta tovar ko'rsatilishi shart.");

        using var tx = await _db.BeginTransactionAsync(ct);

        try
        {
            var sale = await _db.Sales
                .Include(s => s.Items)
                .Include(s => s.Customer)
                .FirstOrDefaultAsync(s => s.Id == dto.SaleId, ct);

            if (sale == null)
                throw new NotFoundException($"ID: {dto.SaleId} bo'lgan savdo topilmadi.");

            if (sale.Status == SaleStatus.Refunded)
                throw new BusinessException("Ushbu savdo bo'yicha tovarlar allaqachon to'liq qaytarilgan.");

            decimal totalRefundAmount = 0;
            var refundItems = new List<SaleRefundItem>();

            foreach (var rItem in dto.Items)
            {
                var saleItem = sale.Items.FirstOrDefault(i => i.ProductId == rItem.ProductId);
                if (saleItem == null)
                    throw new BusinessException($"Ushbu savdoda ID: {rItem.ProductId} bo'lgan mahsulot mavjud emas.");

                decimal remainingAvailableToRefund = saleItem.Quantity - saleItem.RefundedQuantity;
                if (rItem.Quantity > remainingAvailableToRefund)
                {
                    throw new BusinessException(
                        $"'{saleItem.ProductId}' mahsulotidan ko'pi bilan {remainingAvailableToRefund} ta qaytarish mumkin. So'ralgan: {rItem.Quantity}");
                }

                saleItem.RefundedQuantity += rItem.Quantity;

                // Omborga tovar qaytib kiradi
                var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == rItem.ProductId, ct);
                if (product != null)
                {
                    product.StockQuantity += rItem.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;
                }

                decimal unitPrice = rItem.RefundPrice > 0 ? rItem.RefundPrice : saleItem.UnitSellingPrice;
                decimal itemSubtotal = rItem.Quantity * unitPrice;
                totalRefundAmount += itemSubtotal;

                refundItems.Add(new SaleRefundItem
                {
                    ProductId = rItem.ProductId,
                    ProductName = product?.Name ?? "Mahsulot",
                    Quantity = rItem.Quantity,
                    RefundUnitPrice = unitPrice
                });
            }

            // Agar qarzga savdo bo'lgan bo'lsa, mijozning qarzidan kamaytiramiz
            if (sale.DebtAmount > 0 && sale.Customer != null)
            {
                decimal reduceDebt = Math.Min(sale.DebtAmount, totalRefundAmount);
                sale.Customer.TotalDebt = Math.Max(0, sale.Customer.TotalDebt - reduceDebt);
                sale.DebtAmount = Math.Max(0, sale.DebtAmount - reduceDebt);

                var debtTx = new DebtTransaction
                {
                    CustomerId = sale.Customer.Id,
                    Amount = reduceDebt,
                    Type = TransactionType.RepayDebt,
                    Note = $"Vozvrat (#{sale.Id}) bo'yicha qarz kamaytirildi",
                    CreatedAt = DateTime.UtcNow
                };
                _db.DebtTransactions.Add(debtTx);
            }

            // Agar kassa smenasi ochiq bo'lsa, smenadagi qaytarishlarga qo'shish
            var activeShift = await _db.CashShifts.FirstOrDefaultAsync(s => s.Status == ShiftStatus.Open, ct);
            if (activeShift != null)
            {
                activeShift.TotalRefunds += totalRefundAmount;
            }

            // Savdo statusini aniqlash
            bool allRefunded = sale.Items.All(i => i.Quantity <= i.RefundedQuantity);
            sale.Status = allRefunded ? SaleStatus.Refunded : SaleStatus.PartiallyRefunded;

            var refundRecord = new SaleRefund
            {
                SaleId = sale.Id,
                CashierName = !string.IsNullOrWhiteSpace(dto.CashierName) ? dto.CashierName : "Kassir",
                TotalRefundAmount = totalRefundAmount,
                Reason = dto.Reason.Trim(),
                CreatedAt = DateTime.UtcNow,
                Items = refundItems
            };

            _db.SaleRefunds.Add(refundRecord);

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return new SaleRefundResponseDto(
                refundRecord.Id,
                refundRecord.SaleId,
                refundRecord.CashierName,
                refundRecord.TotalRefundAmount,
                refundRecord.Reason,
                refundRecord.CreatedAt,
                refundRecord.Items.Select(it => new SaleRefundItemResponseDto(
                    it.Id,
                    it.ProductId,
                    it.ProductName,
                    it.Quantity,
                    it.RefundUnitPrice,
                    it.Subtotal
                )).ToList()
            );
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<List<SaleRefundResponseDto>> GetRefundsAsync(int? saleId = null, CancellationToken ct = default)
    {
        var query = _db.SaleRefunds
            .AsNoTracking()
            .Include(r => r.Items)
            .AsQueryable();

        if (saleId.HasValue)
            query = query.Where(r => r.SaleId == saleId.Value);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new SaleRefundResponseDto(
                r.Id,
                r.SaleId,
                r.CashierName,
                r.TotalRefundAmount,
                r.Reason,
                r.CreatedAt,
                r.Items.Select(it => new SaleRefundItemResponseDto(
                    it.Id,
                    it.ProductId,
                    it.ProductName,
                    it.Quantity,
                    it.RefundUnitPrice,
                    it.Subtotal
                )).ToList()
            ))
            .ToListAsync(ct);
    }
}
