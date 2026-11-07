using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool? lowStockOnly = null,
        CancellationToken ct = default)
    {
        var products = await _productService.GetAllAsync(search, lowStockOnly, ct);
        return Ok(products);
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResultDto<ProductResponseDto>>> GetPaged(
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] bool? lowStockOnly = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await _productService.GetPagedAsync(search, category, lowStockOnly, pageNumber, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories(CancellationToken ct = default)
    {
        var categories = await _productService.GetCategoriesAsync(ct);
        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponseDto>> GetById(int id, CancellationToken ct = default)
    {
        var product = await _productService.GetByIdAsync(id, ct);
        return Ok(product);
    }

    [HttpGet("barcode/{barcode}")]
    [HttpGet("by-barcode/{barcode}")]
    public async Task<ActionResult<ProductResponseDto>> GetByBarcode(string barcode, CancellationToken ct = default)
    {
        var product = await _productService.GetByBarcodeAsync(barcode, ct);
        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponseDto>> Create([FromBody] CreateProductDto dto, CancellationToken ct = default)
    {
        var created = await _productService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductResponseDto>> Update(int id, [FromBody] UpdateProductDto dto, CancellationToken ct = default)
    {
        var updated = await _productService.UpdateAsync(id, dto, ct);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _productService.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpGet("{id:int}/check-stock")]
    public async Task<ActionResult<bool>> CheckStock(int id, [FromQuery] decimal quantity, CancellationToken ct = default)
    {
        var isAvailable = await _productService.CheckStockAsync(id, quantity, ct);
        return Ok(new { ProductId = id, RequestedQuantity = quantity, IsAvailable = isAvailable });
    }

    [HttpPost("import-csv")]
    public async Task<ActionResult<ImportResultDto>> ImportCsv(IFormFile file, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest("CSV fayl yuklanmadi.");

        using var stream = file.OpenReadStream();
        var result = await _productService.ImportCsvAsync(stream, ct);
        return Ok(result);
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct = default)
    {
        var bytes = await _productService.ExportCsvAsync(ct);
        return File(bytes, "text/csv; charset=utf-8", $"Mahsulotlar_{DateTime.UtcNow:yyyyMMdd_HHmm}.csv");
    }

    [HttpGet("template-csv")]
    public async Task<IActionResult> GetTemplateCsv(CancellationToken ct = default)
    {
        var bytes = await _productService.GetTemplateCsvAsync(ct);
        return File(bytes, "text/csv; charset=utf-8", "Mahsulotlar_Shablon.csv");
    }

    [HttpPost("send-low-stock-alert")]
    public async Task<ActionResult<object>> SendLowStockAlert(
        [FromServices] ITelegramService telegramService,
        [FromServices] IAppDbContext db,
        [FromServices] ICurrentStoreContext storeContext,
        CancellationToken ct = default)
    {
        var storeId = storeContext.StoreId ?? 1;
        var store = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(db.Stores, s => s.Id == storeId, ct);
        if (store == null)
            return BadRequest(new { success = false, message = "Do'kon topilmadi." });

        if (string.IsNullOrWhiteSpace(store.TelegramBotToken) || string.IsNullOrWhiteSpace(store.TelegramChatId))
            return BadRequest(new { success = false, message = "Do'kon sozlamalarida Telegram Bot Token yoki Chat ID ko'rsatilmagan." });

        var lowStockProducts = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            db.Products.Where(p => p.StoreId == storeId && p.StockQuantity <= p.MinStockAlert), ct);

        if (lowStockProducts.Count == 0)
            return Ok(new { success = true, count = 0, message = "Kam qolgan tovarlar mavjud emas (barcha mahsulotlar yetarli darajada)." });

        var sent = await telegramService.SendLowStockAlertAsync(store, lowStockProducts, ct);
        return Ok(new
        {
            success = sent,
            count = lowStockProducts.Count,
            message = sent
                ? $"{lowStockProducts.Count} ta kam qolgan tovarlar ro'yxati Telegram guruhingizga yuborildi!"
                : "Telegramga yuborishda xatolik yuz berdi. Bot token va Chat ID ni tekshiring."
        });
    }
}
