using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class SupplyService : ISupplyService
{
    private readonly IAppDbContext _db;

    public SupplyService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<SupplierResponseDto>> GetSuppliersAsync(CancellationToken ct = default)
    {
        return await _db.Suppliers
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new SupplierResponseDto(
                s.Id,
                s.Name,
                s.Phone,
                s.Company,
                s.Address,
                s.TotalDebtToSupplier,
                s.CreatedAt
            ))
            .ToListAsync(ct);
    }

    public async Task<SupplierResponseDto> CreateSupplierAsync(CreateSupplierDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessException("Ta'minotchi nomi kiritilishi shart.");

        var supplier = new Supplier
        {
            Name = dto.Name.Trim(),
            Phone = dto.Phone?.Trim() ?? string.Empty,
            Company = dto.Company?.Trim(),
            Address = dto.Address?.Trim(),
            TotalDebtToSupplier = 0,
            CreatedAt = DateTime.UtcNow
        };

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync(ct);

        return new SupplierResponseDto(
            supplier.Id,
            supplier.Name,
            supplier.Phone,
            supplier.Company,
            supplier.Address,
            supplier.TotalDebtToSupplier,
            supplier.CreatedAt
        );
    }

    public async Task<SupplierResponseDto> UpdateSupplierAsync(int id, UpdateSupplierDto dto, CancellationToken ct = default)
    {
        var supplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (supplier == null)
            throw new NotFoundException($"ID: {id} bo'lgan ta'minotchi topilmadi.");

        supplier.Name = dto.Name.Trim();
        supplier.Phone = dto.Phone?.Trim() ?? string.Empty;
        supplier.Company = dto.Company?.Trim();
        supplier.Address = dto.Address?.Trim();

        await _db.SaveChangesAsync(ct);

        return new SupplierResponseDto(
            supplier.Id,
            supplier.Name,
            supplier.Phone,
            supplier.Company,
            supplier.Address,
            supplier.TotalDebtToSupplier,
            supplier.CreatedAt
        );
    }

    public async Task<SupplierResponseDto> PaySupplierDebtAsync(PaySupplierDebtDto dto, CancellationToken ct = default)
    {
        if (dto.Amount <= 0)
            throw new BusinessException("To'lov summasi 0 dan katta bo'lishi shart.");

        var supplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == dto.SupplierId, ct);
        if (supplier == null)
            throw new NotFoundException($"ID: {dto.SupplierId} bo'lgan ta'minotchi topilmadi.");

        supplier.TotalDebtToSupplier = Math.Max(0, supplier.TotalDebtToSupplier - dto.Amount);

        // Chiqim xarajati sifatida qayd etish
        var expense = new Expense
        {
            Title = $"Ta'minotchiga qarz to'lovi: {supplier.Name}",
            Amount = dto.Amount,
            Category = "Ta'minotchi qarz to'lovi",
            CreatedAt = DateTime.UtcNow
        };
        _db.Expenses.Add(expense);

        await _db.SaveChangesAsync(ct);

        return new SupplierResponseDto(
            supplier.Id,
            supplier.Name,
            supplier.Phone,
            supplier.Company,
            supplier.Address,
            supplier.TotalDebtToSupplier,
            supplier.CreatedAt
        );
    }

    public async Task<List<SupplyInvoiceResponseDto>> GetInvoicesAsync(int? supplierId = null, CancellationToken ct = default)
    {
        var query = _db.SupplyInvoices
            .AsNoTracking()
            .Include(i => i.Items)
            .AsQueryable();

        if (supplierId.HasValue)
            query = query.Where(i => i.SupplierId == supplierId.Value);

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new SupplyInvoiceResponseDto(
                i.Id,
                i.SupplierId,
                i.SupplierName,
                i.InvoiceNumber,
                i.TotalAmount,
                i.PaidAmount,
                i.DebtAmount,
                i.CreatedAt,
                i.Note,
                i.Items.Select(it => new SupplyInvoiceItemResponseDto(
                    it.Id,
                    it.ProductId,
                    it.ProductName,
                    it.Quantity,
                    it.CostPrice,
                    it.SellingPrice,
                    it.Subtotal
                )).ToList()
            ))
            .ToListAsync(ct);
    }

    public async Task<SupplyInvoiceResponseDto> ReceiveGoodsAsync(CreateSupplyInvoiceDto dto, CancellationToken ct = default)
    {
        if (dto.Items == null || !dto.Items.Any())
            throw new BusinessException("Kirim hujjati uchun kamida bitta mahsulot kiritilishi shart.");

        using var tx = await _db.BeginTransactionAsync(ct);

        try
        {
            Supplier? supplier = null;
            string supplierName = dto.SupplierName ?? string.Empty;

            if (dto.SupplierId.HasValue)
            {
                supplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == dto.SupplierId.Value, ct);
                if (supplier != null)
                    supplierName = supplier.Name;
            }

            decimal totalAmount = dto.Items.Sum(i => i.Quantity * i.CostPrice);
            decimal debtAmount = Math.Max(0, totalAmount - dto.PaidAmount);

            if (supplier != null && debtAmount > 0)
            {
                supplier.TotalDebtToSupplier += debtAmount;
            }

            var invoice = new SupplyInvoice
            {
                SupplierId = supplier?.Id,
                SupplierName = supplierName,
                InvoiceNumber = !string.IsNullOrWhiteSpace(dto.InvoiceNumber) 
                    ? dto.InvoiceNumber.Trim() 
                    : $"KIRIM-{DateTime.UtcNow:yyyyMMddHHmmss}",
                TotalAmount = totalAmount,
                PaidAmount = dto.PaidAmount,
                DebtAmount = debtAmount,
                CreatedAt = DateTime.UtcNow,
                Note = dto.Note
            };

            var invoiceItems = new List<SupplyInvoiceItem>();

            foreach (var itemDto in dto.Items)
            {
                Product? product = null;

                if (itemDto.ProductId.HasValue && itemDto.ProductId.Value > 0)
                {
                    product = await _db.Products.FirstOrDefaultAsync(p => p.Id == itemDto.ProductId.Value, ct);
                }

                if (product == null && !string.IsNullOrWhiteSpace(itemDto.Barcode))
                {
                    product = await _db.Products.FirstOrDefaultAsync(p => p.Barcode == itemDto.Barcode.Trim(), ct);
                }

                if (product != null)
                {
                    // Mahsulot qoldig'i va narxlarini yangilash
                    product.StockQuantity += itemDto.Quantity;
                    product.CostPrice = itemDto.CostPrice;
                    if (itemDto.SellingPrice > 0)
                        product.SellingPrice = itemDto.SellingPrice;
                    product.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Yangi mahsulot yaratish
                    product = new Product
                    {
                        Barcode = !string.IsNullOrWhiteSpace(itemDto.Barcode) 
                            ? itemDto.Barcode.Trim() 
                            : DateTime.UtcNow.Ticks.ToString().Substring(8, 12),
                        Name = itemDto.Name.Trim(),
                        CostPrice = itemDto.CostPrice,
                        SellingPrice = itemDto.SellingPrice,
                        StockQuantity = itemDto.Quantity,
                        Unit = !string.IsNullOrWhiteSpace(itemDto.Unit) ? itemDto.Unit.Trim() : "dona",
                        Category = !string.IsNullOrWhiteSpace(itemDto.Category) ? itemDto.Category.Trim() : "Umumiy",
                        MinStockAlert = 5,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Products.Add(product);
                    await _db.SaveChangesAsync(ct);
                }

                invoiceItems.Add(new SupplyInvoiceItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = itemDto.Quantity,
                    CostPrice = itemDto.CostPrice,
                    SellingPrice = itemDto.SellingPrice > 0 ? itemDto.SellingPrice : product.SellingPrice
                });
            }

            invoice.Items = invoiceItems;
            _db.SupplyInvoices.Add(invoice);

            if (dto.PaidAmount > 0)
            {
                // To'langan qism xarajatga tushadi
                var expense = new Expense
                {
                    Title = $"Tovarlar kirimi to'lovi (#{invoice.InvoiceNumber}): {supplierName}",
                    Amount = dto.PaidAmount,
                    Category = "Tovarlar kirimi",
                    CreatedAt = DateTime.UtcNow
                };
                _db.Expenses.Add(expense);
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return new SupplyInvoiceResponseDto(
                invoice.Id,
                invoice.SupplierId,
                invoice.SupplierName,
                invoice.InvoiceNumber,
                invoice.TotalAmount,
                invoice.PaidAmount,
                invoice.DebtAmount,
                invoice.CreatedAt,
                invoice.Note,
                invoice.Items.Select(it => new SupplyInvoiceItemResponseDto(
                    it.Id,
                    it.ProductId,
                    it.ProductName,
                    it.Quantity,
                    it.CostPrice,
                    it.SellingPrice,
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
}
