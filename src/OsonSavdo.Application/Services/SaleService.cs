using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class SaleService : ISaleService
{
    private readonly IAppDbContext _db;

    public SaleService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<SaleResponseDto> ProcessSaleAsync(CreateSaleDto dto, CancellationToken ct = default)
    {
        if (dto.Items == null || !dto.Items.Any())
            throw new BusinessException("Savdo uchun kamida bitta mahsulot kiritilishi shart.");

        // Tranzaksiya boshlanishi
        using var transaction = await _db.BeginTransactionAsync(ct);

        try
        {
            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _db.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, ct);

            // Barcha mahsulotlar mavjudligini tekshirish
            foreach (var itemDto in dto.Items)
            {
                if (!products.TryGetValue(itemDto.ProductId, out var product))
                    throw new NotFoundException($"ID: {itemDto.ProductId} bo'lgan mahsulot topilmadi.");

                if (product.StockQuantity < itemDto.Quantity)
                {
                    throw new BusinessException(
                        $"Omborda yetarli mahsulot yo'q: '{product.Name}'. Mavjud: {product.StockQuantity} {product.Unit}, So'ralgan: {itemDto.Quantity} {product.Unit}");
                }
            }

            var saleItems = new List<SaleItem>();
            decimal itemsSubtotal = 0;

            // Ombordan qoldiqni kamaytirish va SaleItem obyektlarini shakllantirish
            foreach (var itemDto in dto.Items)
            {
                var product = products[itemDto.ProductId];

                product.StockQuantity -= itemDto.Quantity;
                product.UpdatedAt = DateTime.UtcNow;

                decimal sellingPrice = itemDto.UnitSellingPrice ?? product.SellingPrice;
                decimal itemDiscount = itemDto.DiscountAmount;
                itemsSubtotal += (itemDto.Quantity * sellingPrice) - itemDiscount;

                saleItems.Add(new SaleItem
                {
                    ProductId = product.Id,
                    Quantity = itemDto.Quantity,
                    UnitCostPrice = product.CostPrice,
                    UnitSellingPrice = sellingPrice,
                    DiscountAmount = itemDiscount,
                    RefundedQuantity = 0
                });
            }

            decimal overallDiscount = dto.DiscountAmount;
            decimal calculatedTotalAmount = Math.Max(0, itemsSubtotal - overallDiscount);

            decimal paidAmount;
            decimal debtAmount;
            decimal paidCash = 0;
            decimal paidCard = 0;

            switch (dto.PaymentType)
            {
                case PaymentType.Debt:
                    paidAmount = 0;
                    debtAmount = calculatedTotalAmount;
                    break;

                case PaymentType.Mixed:
                    paidCash = dto.PaidCash;
                    paidCard = dto.PaidCard;
                    paidAmount = paidCash + paidCard;
                    if (paidAmount < 0)
                        throw new BusinessException("To'langan summa manfiy bo'lishi mumkin emas.");
                    if (paidAmount > calculatedTotalAmount)
                        throw new BusinessException($"To'langan summa ({paidAmount:N2}) umumiy summadan ({calculatedTotalAmount:N2}) oshib ketdi.");

                    debtAmount = calculatedTotalAmount - paidAmount;
                    break;

                case PaymentType.Card:
                    paidAmount = calculatedTotalAmount;
                    paidCard = calculatedTotalAmount;
                    debtAmount = 0;
                    break;

                case PaymentType.Cash:
                default:
                    paidAmount = calculatedTotalAmount;
                    paidCash = calculatedTotalAmount;
                    debtAmount = 0;
                    break;
            }

            // Qarz bo'lsa Customer va DebtTransaction tekshiruvi
            Customer? customer = null;
            if (debtAmount > 0)
            {
                if (!dto.CustomerId.HasValue)
                    throw new BusinessException("Qarzga savdo qilish uchun mijoz tanlanishi shart!");

                customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == dto.CustomerId.Value, ct);
                if (customer == null)
                    throw new NotFoundException($"ID: {dto.CustomerId.Value} bo'lgan mijoz topilmadi.");

                customer.TotalDebt += debtAmount;

                var debtTx = new DebtTransaction
                {
                    CustomerId = customer.Id,
                    Amount = debtAmount,
                    Type = TransactionType.TakeDebt,
                    Note = $"Savdo orqali qarz (Umumiy: {calculatedTotalAmount:N2}, To'landi: {paidAmount:N2})",
                    CreatedAt = DateTime.UtcNow
                };

                _db.DebtTransactions.Add(debtTx);
            }
            else if (dto.CustomerId.HasValue)
            {
                customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == dto.CustomerId.Value, ct);
            }

            decimal cashbackEarned = 0;
            decimal cashbackUsed = dto.CashbackUsed;

            if (customer != null)
            {
                if (cashbackUsed > 0)
                {
                    if (customer.CashbackBalance < cashbackUsed)
                        throw new BusinessException($"Mijozda yetarli bonus mavjud emas. Mavjud bonus: {customer.CashbackBalance:N0} so'm");
                    
                    customer.CashbackBalance -= cashbackUsed;
                }

                var eligibleAmount = Math.Max(0, paidAmount - cashbackUsed);
                var rate = customer.CashbackPercent > 0 ? customer.CashbackPercent : 1.0m;
                cashbackEarned = Math.Round(eligibleAmount * (rate / 100m), 0);
                customer.CashbackBalance += cashbackEarned;
            }

            // Kassa smenasini aniqlash (agar ochiq smena bo'lsa)
            CashShift? shift = null;
            if (dto.CashShiftId.HasValue)
            {
                shift = await _db.CashShifts.FirstOrDefaultAsync(s => s.Id == dto.CashShiftId.Value && s.Status == ShiftStatus.Open, ct);
            }
            if (shift == null)
            {
                shift = await _db.CashShifts.FirstOrDefaultAsync(s => s.Status == ShiftStatus.Open, ct);
            }

            var sale = new Sale
            {
                TotalAmount = calculatedTotalAmount,
                PaidAmount = paidAmount,
                DebtAmount = debtAmount,
                DiscountAmount = overallDiscount,
                PaidCash = paidCash,
                PaidCard = paidCard,
                CashbackEarned = cashbackEarned,
                CashbackUsed = cashbackUsed,
                PaymentType = dto.PaymentType,
                Status = SaleStatus.Completed,
                CustomerId = customer?.Id,
                CashShiftId = shift?.Id,
                CashierName = !string.IsNullOrWhiteSpace(dto.CashierName) ? dto.CashierName : "Kassir",
                CreatedAt = DateTime.UtcNow,
                Items = saleItems
            };

            _db.Sales.Add(sale);
            await _db.SaveChangesAsync(ct);

            // Barcha amallar muvaffaqiyatli bo'lsa tranzaksiyani tasdiqlaymiz
            await transaction.CommitAsync(ct);

            return MapToDto(sale, customer?.FullName, products);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<SaleResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var sale = await _db.Sales
            .AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (sale == null)
            throw new NotFoundException($"ID: {id} bo'lgan savdo topilmadi.");

        return MapEntityToDto(sale);
    }

    public async Task<IEnumerable<SaleResponseDto>> GetSalesAsync(DateTime? fromDate = null, DateTime? toDate = null, int? customerId = null, CancellationToken ct = default)
    {
        var query = _db.Sales
            .AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Items)
                .ThenInclude(i => i.Product)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(s => s.CreatedAt >= fromDate.Value.ToUniversalTime());

        if (toDate.HasValue)
            query = query.Where(s => s.CreatedAt <= toDate.Value.ToUniversalTime());

        if (customerId.HasValue)
            query = query.Where(s => s.CustomerId == customerId.Value);

        return await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SaleResponseDto
            {
                Id = s.Id,
                TotalAmount = s.TotalAmount,
                PaidAmount = s.PaidAmount,
                DebtAmount = s.DebtAmount,
                DiscountAmount = s.DiscountAmount,
                PaidCash = s.PaidCash,
                PaidCard = s.PaidCard,
                PaymentType = s.PaymentType,
                Status = s.Status,
                CashierName = s.CashierName,
                CashShiftId = s.CashShiftId,
                CustomerId = s.CustomerId,
                CustomerName = s.Customer != null ? s.Customer.FullName : null,
                CreatedAt = s.CreatedAt,
                Items = s.Items.Select(i => new SaleItemResponseDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.Product.Name,
                    ProductBarcode = i.Product.Barcode,
                    Quantity = i.Quantity,
                    UnitCostPrice = i.UnitCostPrice,
                    UnitSellingPrice = i.UnitSellingPrice,
                    DiscountAmount = i.DiscountAmount,
                    RefundedQuantity = i.RefundedQuantity
                }).ToList()
            })
            .ToListAsync(ct);
    }

    private static SaleResponseDto MapEntityToDto(Sale sale) => new()
    {
        Id = sale.Id,
        TotalAmount = sale.TotalAmount,
        PaidAmount = sale.PaidAmount,
        DebtAmount = sale.DebtAmount,
        DiscountAmount = sale.DiscountAmount,
        PaidCash = sale.PaidCash,
        PaidCard = sale.PaidCard,
        CashbackEarned = sale.CashbackEarned,
        CashbackUsed = sale.CashbackUsed,
        PaymentType = sale.PaymentType,
        Status = sale.Status,
        CashierName = sale.CashierName,
        CashShiftId = sale.CashShiftId,
        CustomerId = sale.CustomerId,
        CustomerName = sale.Customer?.FullName,
        CreatedAt = sale.CreatedAt,
        Items = sale.Items.Select(i => new SaleItemResponseDto
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ProductName = i.Product?.Name ?? string.Empty,
            ProductBarcode = i.Product?.Barcode ?? string.Empty,
            Quantity = i.Quantity,
            UnitCostPrice = i.UnitCostPrice,
            UnitSellingPrice = i.UnitSellingPrice,
            DiscountAmount = i.DiscountAmount,
            RefundedQuantity = i.RefundedQuantity
        }).ToList()
    };

    private static SaleResponseDto MapToDto(Sale s, string? customerName, Dictionary<int, Product> products) => new()
    {
        Id = s.Id,
        TotalAmount = s.TotalAmount,
        PaidAmount = s.PaidAmount,
        DebtAmount = s.DebtAmount,
        DiscountAmount = s.DiscountAmount,
        PaidCash = s.PaidCash,
        PaidCard = s.PaidCard,
        CashbackEarned = s.CashbackEarned,
        CashbackUsed = s.CashbackUsed,
        PaymentType = s.PaymentType,
        Status = s.Status,
        CashierName = s.CashierName,
        CashShiftId = s.CashShiftId,
        CustomerId = s.CustomerId,
        CustomerName = customerName,
        CreatedAt = s.CreatedAt,
        Items = s.Items.Select(i => new SaleItemResponseDto
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ProductName = products.TryGetValue(i.ProductId, out var prod) ? prod.Name : string.Empty,
            ProductBarcode = products.TryGetValue(i.ProductId, out var prod2) ? prod2.Barcode : string.Empty,
            Quantity = i.Quantity,
            UnitCostPrice = i.UnitCostPrice,
            UnitSellingPrice = i.UnitSellingPrice,
            DiscountAmount = i.DiscountAmount,
            RefundedQuantity = i.RefundedQuantity
        }).ToList()
    };
}
