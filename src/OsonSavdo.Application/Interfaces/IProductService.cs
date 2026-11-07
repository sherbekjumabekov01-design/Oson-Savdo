using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductResponseDto>> GetAllAsync(string? search = null, bool? lowStockOnly = null, CancellationToken ct = default);
    Task<PagedResultDto<ProductResponseDto>> GetPagedAsync(string? search = null, string? category = null, bool? lowStockOnly = null, int pageNumber = 1, int pageSize = 50, CancellationToken ct = default);
    Task<ProductResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ProductResponseDto> GetByBarcodeAsync(string barcode, CancellationToken ct = default);
    Task<ProductResponseDto> CreateAsync(CreateProductDto dto, CancellationToken ct = default);
    Task<ProductResponseDto> UpdateAsync(int id, UpdateProductDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> CheckStockAsync(int productId, decimal requiredQuantity, CancellationToken ct = default);
    Task<ImportResultDto> ImportCsvAsync(Stream csvStream, CancellationToken ct = default);
    Task<byte[]> ExportCsvAsync(CancellationToken ct = default);
    Task<byte[]> GetTemplateCsvAsync(CancellationToken ct = default);
    Task<List<string>> GetCategoriesAsync(CancellationToken ct = default);
}
