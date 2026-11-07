using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class ProductService : IProductService
{
    private readonly IAppDbContext _db;

    public ProductService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ProductResponseDto>> GetAllAsync(string? search = null, bool? lowStockOnly = null, CancellationToken ct = default)
    {
        var query = _db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmedSearch = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(trimmedSearch) || p.Barcode.ToLower().Contains(trimmedSearch));
        }

        if (lowStockOnly == true)
        {
            query = query.Where(p => p.StockQuantity <= p.MinStockAlert);
        }

        return await query
            .OrderBy(p => p.Name)
            .Select(p => MapToDto(p))
            .ToListAsync(ct);
    }

    public async Task<PagedResultDto<ProductResponseDto>> GetPagedAsync(
        string? search = null,
        string? category = null,
        bool? lowStockOnly = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken ct = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmedSearch = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(trimmedSearch) || p.Barcode.ToLower().Contains(trimmedSearch));
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "All" && category != "Barchasi")
        {
            query = query.Where(p => p.Category == category);
        }

        if (lowStockOnly == true)
        {
            query = query.Where(p => p.StockQuantity <= p.MinStockAlert);
        }

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderBy(p => p.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => MapToDto(p))
            .ToListAsync(ct);

        return new PagedResultDto<ProductResponseDto>(
            Items: items,
            TotalCount: totalCount,
            PageNumber: pageNumber,
            PageSize: pageSize,
            TotalPages: totalPages
        );
    }

    public async Task<ProductResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var product = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product == null)
            throw new NotFoundException($"ID: {id} bo'lgan mahsulot topilmadi.");

        return MapToDto(product);
    }

    public async Task<ProductResponseDto> GetByBarcodeAsync(string barcode, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(barcode))
            throw new BusinessException("Shtrix-kod kiritilishi shart.");

        var trimmedBarcode = barcode.Trim();
        var product = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Barcode == trimmedBarcode, ct);
        
        // Agar to'g'ridan-to'g'ri topilmasa va bu tarozi shtrix-kodi bo'lsa (masalan: 2100105012503)
        if (product == null && trimmedBarcode.Length == 13 && (trimmedBarcode.StartsWith("21") || trimmedBarcode.StartsWith("22")))
        {
            var plu = trimmedBarcode.Substring(2, 5); // 00105
            var shortPlu = plu.TrimStart('0'); // 105
            product = await _db.Products.AsNoTracking()
                .FirstOrDefaultAsync(p => p.PluCode == plu || p.PluCode == shortPlu || p.Barcode == plu || p.Barcode == shortPlu || (p.IsWeighted && p.Barcode.EndsWith(plu)), ct);
        }

        if (product == null)
            throw new NotFoundException($"'{trimmedBarcode}' shtrix-kodli mahsulot topilmadi.");

        return MapToDto(product);
    }

    public async Task<ProductResponseDto> CreateAsync(CreateProductDto dto, CancellationToken ct = default)
    {
        var trimmedBarcode = dto.Barcode.Trim();
        var exists = await _db.Products.AnyAsync(p => p.Barcode == trimmedBarcode, ct);
        if (exists)
            throw new BusinessException($"'{trimmedBarcode}' shtrix-kodli mahsulot bazada allaqachon mavjud.");

        var product = new Product
        {
            Barcode = trimmedBarcode,
            Name = dto.Name.Trim(),
            CostPrice = dto.CostPrice,
            SellingPrice = dto.SellingPrice,
            StockQuantity = dto.StockQuantity,
            Unit = dto.Unit.Trim(),
            Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim() : "Umumiy",
            MinStockAlert = dto.MinStockAlert,
            IsWeighted = dto.IsWeighted,
            PluCode = dto.PluCode?.Trim(),
            ExpiryDate = dto.ExpiryDate,
            IsUsdPrice = dto.IsUsdPrice,
            CostPriceUsd = dto.CostPriceUsd,
            SellingPriceUsd = dto.SellingPriceUsd,
            CreatedAt = DateTime.UtcNow
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);

        return MapToDto(product);
    }

    public async Task<ProductResponseDto> UpdateAsync(int id, UpdateProductDto dto, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product == null)
            throw new NotFoundException($"ID: {id} bo'lgan mahsulot topilmadi.");

        var trimmedBarcode = dto.Barcode.Trim();
        var barcodeTaken = await _db.Products.AnyAsync(p => p.Barcode == trimmedBarcode && p.Id != id, ct);
        if (barcodeTaken)
            throw new BusinessException($"'{trimmedBarcode}' shtrix-kodi boshqa mahsulotga biriktirilgan.");

        product.Barcode = trimmedBarcode;
        product.Name = dto.Name.Trim();
        product.CostPrice = dto.CostPrice;
        product.SellingPrice = dto.SellingPrice;
        product.StockQuantity = dto.StockQuantity;
        product.Unit = dto.Unit.Trim();
        product.Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim() : "Umumiy";
        product.MinStockAlert = dto.MinStockAlert;
        product.IsWeighted = dto.IsWeighted;
        product.PluCode = dto.PluCode?.Trim();
        product.ExpiryDate = dto.ExpiryDate;
        product.IsUsdPrice = dto.IsUsdPrice;
        product.CostPriceUsd = dto.CostPriceUsd;
        product.SellingPriceUsd = dto.SellingPriceUsd;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return MapToDto(product);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product == null)
            throw new NotFoundException($"ID: {id} bo'lgan mahsulot topilmadi.");

        var hasSales = await _db.SaleItems.AnyAsync(si => si.ProductId == id, ct);
        if (hasSales)
            throw new BusinessException("Ushbu mahsulot bo'yicha savdo tarixi mavjud, uni o'chirish mumkin emas. Qoldiqni 0 qilib qo'yishingiz mumkin.");

        _db.Products.Remove(product);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> CheckStockAsync(int productId, decimal requiredQuantity, CancellationToken ct = default)
    {
        var product = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product == null)
            throw new NotFoundException($"ID: {productId} bo'lgan mahsulot topilmadi.");

        return product.StockQuantity >= requiredQuantity;
    }

    public async Task<List<string>> GetCategoriesAsync(CancellationToken ct = default)
    {
        var list = await _db.Products
            .AsNoTracking()
            .Select(p => p.Category)
            .Distinct()
            .ToListAsync(ct);

        return list.Where(c => !string.IsNullOrWhiteSpace(c)).OrderBy(c => c).ToList();
    }

    public async Task<ImportResultDto> ImportCsvAsync(Stream csvStream, CancellationToken ct = default)
    {
        using var reader = new StreamReader(csvStream, Encoding.UTF8);
        int totalProcessed = 0;
        int addedCount = 0;
        int updatedCount = 0;
        var errors = new List<string>();

        string? headerLine = await reader.ReadLineAsync(ct);
        if (headerLine == null)
            return new ImportResultDto(0, 0, 0, new List<string> { "Fayl bo'sh." });

        char delimiter = headerLine.Contains(';') ? ';' : ',';
        int lineNum = 1;

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(ct);
            lineNum++;
            if (string.IsNullOrWhiteSpace(line)) continue;

            totalProcessed++;
            var parts = ParseCsvLine(line, delimiter);

            if (parts.Count < 2)
            {
                errors.Add($"Qator {lineNum}: Yetarli ustunlar mavjud emas.");
                continue;
            }

            string barcode = parts[0].Trim();
            string name = parts[1].Trim();

            if (string.IsNullOrWhiteSpace(barcode) || string.IsNullOrWhiteSpace(name))
            {
                errors.Add($"Qator {lineNum}: Shtrix-kod yoki mahsulot nomi bo'sh.");
                continue;
            }

            decimal costPrice = parts.Count > 2 && decimal.TryParse(parts[2].Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var cp) ? cp : 0;
            decimal sellingPrice = parts.Count > 3 && decimal.TryParse(parts[3].Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var sp) ? sp : 0;
            decimal stockQty = parts.Count > 4 && decimal.TryParse(parts[4].Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var sq) ? sq : 0;
            string unit = parts.Count > 5 && !string.IsNullOrWhiteSpace(parts[5]) ? parts[5].Trim() : "dona";
            string category = parts.Count > 6 && !string.IsNullOrWhiteSpace(parts[6]) ? parts[6].Trim() : "Umumiy";
            decimal minStock = parts.Count > 7 && decimal.TryParse(parts[7].Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var ms) ? ms : 5;

            var existing = await _db.Products.FirstOrDefaultAsync(p => p.Barcode == barcode, ct);
            if (existing != null)
            {
                existing.Name = name;
                existing.CostPrice = costPrice;
                existing.SellingPrice = sellingPrice;
                existing.StockQuantity += stockQty;
                existing.Unit = unit;
                existing.Category = category;
                existing.MinStockAlert = minStock;
                existing.UpdatedAt = DateTime.UtcNow;
                updatedCount++;
            }
            else
            {
                var newProd = new Product
                {
                    Barcode = barcode,
                    Name = name,
                    CostPrice = costPrice,
                    SellingPrice = sellingPrice,
                    StockQuantity = stockQty,
                    Unit = unit,
                    Category = category,
                    MinStockAlert = minStock,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Products.Add(newProd);
                addedCount++;
            }
        }

        await _db.SaveChangesAsync(ct);
        return new ImportResultDto(totalProcessed, addedCount, updatedCount, errors);
    }

    public async Task<byte[]> ExportCsvAsync(CancellationToken ct = default)
    {
        var products = await _db.Products
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

        var sb = new StringBuilder();
        // Sarlavhalar
        sb.AppendLine("Shtrix-kod;Nomi;Tan narxi;Sotish narxi;Qoldiq;Birligi;Kategoriya;Min qoldiq");

        foreach (var p in products)
        {
            sb.AppendLine($"{EscapeCsv(p.Barcode)};{EscapeCsv(p.Name)};{p.CostPrice.ToString("F2", CultureInfo.InvariantCulture)};{p.SellingPrice.ToString("F2", CultureInfo.InvariantCulture)};{p.StockQuantity.ToString("F2", CultureInfo.InvariantCulture)};{EscapeCsv(p.Unit)};{EscapeCsv(p.Category)};{p.MinStockAlert.ToString("F2", CultureInfo.InvariantCulture)}");
        }

        // UTF-8 with BOM so Excel opens it with full Cyrillic / Uzbek support
        var preamble = Encoding.UTF8.GetPreamble();
        var contentBytes = Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[preamble.Length + contentBytes.Length];
        Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
        Buffer.BlockCopy(contentBytes, 0, result, preamble.Length, contentBytes.Length);

        return result;
    }

    public Task<byte[]> GetTemplateCsvAsync(CancellationToken ct = default)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Shtrix-kod;Nomi;Tan narxi;Sotish narxi;Qoldiq;Birligi;Kategoriya;Min qoldiq");
        sb.AppendLine("4780012345678;Coca-Cola 1.5L;10500;14000;45;dona;Ichimliklar;10");
        sb.AppendLine("4780087654321;Nestle Sut 1L;11000;14500;20;dona;Sut mahsulotlari;5");
        sb.AppendLine("4780033221144;Shakar;9500;12000;100;kg;Baqqollik;20");

        var preamble = Encoding.UTF8.GetPreamble();
        var contentBytes = Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[preamble.Length + contentBytes.Length];
        Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
        Buffer.BlockCopy(contentBytes, 0, result, preamble.Length, contentBytes.Length);

        return Task.FromResult(result);
    }

    private static List<string> ParseCsvLine(string line, char delimiter)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == delimiter && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString());
        return result;
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains(';') || value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    private static ProductResponseDto MapToDto(Product p) => new()
    {
        Id = p.Id,
        Barcode = p.Barcode,
        Name = p.Name,
        CostPrice = p.CostPrice,
        SellingPrice = p.SellingPrice,
        StockQuantity = p.StockQuantity,
        Unit = p.Unit,
        Category = p.Category,
        MinStockAlert = p.MinStockAlert,
        IsWeighted = p.IsWeighted,
        PluCode = p.PluCode,
        ExpiryDate = p.ExpiryDate,
        IsUsdPrice = p.IsUsdPrice,
        CostPriceUsd = p.CostPriceUsd,
        SellingPriceUsd = p.SellingPriceUsd,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}
