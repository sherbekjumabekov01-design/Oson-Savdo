using Microsoft.AspNetCore.Mvc;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;

namespace OsonSavdo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerResponseDto>>> GetAll([FromQuery] string? search = null, CancellationToken ct = default)
    {
        var customers = await _customerService.GetAllAsync(search, ct);
        return Ok(customers);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomerResponseDto>> GetById(int id, CancellationToken ct = default)
    {
        var customer = await _customerService.GetByIdAsync(id, ct);
        return Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerResponseDto>> Create([FromBody] CreateCustomerDto dto, CancellationToken ct = default)
    {
        var created = await _customerService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomerResponseDto>> Update(int id, [FromBody] UpdateCustomerDto dto, CancellationToken ct = default)
    {
        var updated = await _customerService.UpdateAsync(id, dto, ct);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _customerService.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:int}/send-reminder")]
    public async Task<ActionResult<object>> SendReminder(
        int id,
        [FromServices] ITelegramService telegramService,
        [FromServices] IAppDbContext db,
        [FromServices] ICurrentStoreContext storeContext,
        CancellationToken ct = default)
    {
        var customer = await _customerService.GetByIdAsync(id, ct);
        if (customer.TotalDebt <= 0)
            return BadRequest(new { success = false, message = "Ushbu mijozning qarzi mavjud emas." });

        var storeId = storeContext.StoreId ?? 1;
        var store = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(db.Stores, s => s.Id == storeId, ct);
        var storeName = store?.Name ?? "Oson Savdo Do'koni";
        var storePhone = store?.Phone ?? "";

        var smsTemplate = $"Hurmatli {customer.FullName}, '{storeName}' do'konidan nasiya xaridingiz bo'yicha qoldiq qarz: {customer.TotalDebt:N0} so'm. To'lov muddati kelganligini eslatib o'tamiz. Aloqa uchun: {storePhone}";

        bool telegramSent = false;
        if (store != null)
        {
            var custEntity = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(db.Customers, c => c.Id == id, ct);
            if (custEntity != null)
            {
                telegramSent = await telegramService.SendDebtReminderAsync(store, custEntity, ct);
            }
        }

        return Ok(new
        {
            success = true,
            telegramSent,
            smsTemplate,
            customerPhone = customer.Phone,
            message = telegramSent
                ? "Telegram xabarnomasi yuborildi va SMS eslatma shabloni tayyorlandi!"
                : "SMS eslatma matni tayyorlandi."
        });
    }
}
