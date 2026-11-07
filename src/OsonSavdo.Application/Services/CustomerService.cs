using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly IAppDbContext _db;

    public CustomerService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<CustomerResponseDto>> GetAllAsync(string? search = null, CancellationToken ct = default)
    {
        var query = _db.Customers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmed = search.Trim().ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(trimmed) || c.Phone.Contains(trimmed));
        }

        return await query
            .OrderBy(c => c.FullName)
            .Select(c => new CustomerResponseDto
            {
                Id = c.Id,
                FullName = c.FullName,
                Phone = c.Phone,
                TotalDebt = c.TotalDebt,
                CashbackBalance = c.CashbackBalance,
                CashbackPercent = c.CashbackPercent,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(ct);
    }

    public async Task<CustomerResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var customer = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (customer == null)
            throw new NotFoundException($"ID: {id} bo'lgan mijoz topilmadi.");

        return new CustomerResponseDto
        {
            Id = customer.Id,
            FullName = customer.FullName,
            Phone = customer.Phone,
            TotalDebt = customer.TotalDebt,
            CashbackBalance = customer.CashbackBalance,
            CashbackPercent = customer.CashbackPercent,
            CreatedAt = customer.CreatedAt
        };
    }

    public async Task<CustomerResponseDto> CreateAsync(CreateCustomerDto dto, CancellationToken ct = default)
    {
        var customer = new Customer
        {
            FullName = dto.FullName.Trim(),
            Phone = dto.Phone.Trim(),
            TotalDebt = 0,
            CashbackBalance = 0,
            CashbackPercent = dto.CashbackPercent > 0 ? dto.CashbackPercent : 1.0m,
            CreatedAt = DateTime.UtcNow
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync(ct);

        return new CustomerResponseDto
        {
            Id = customer.Id,
            FullName = customer.FullName,
            Phone = customer.Phone,
            TotalDebt = customer.TotalDebt,
            CashbackBalance = customer.CashbackBalance,
            CashbackPercent = customer.CashbackPercent,
            CreatedAt = customer.CreatedAt
        };
    }

    public async Task<CustomerResponseDto> UpdateAsync(int id, UpdateCustomerDto dto, CancellationToken ct = default)
    {
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (customer == null)
            throw new NotFoundException($"ID: {id} bo'lgan mijoz topilmadi.");

        customer.FullName = dto.FullName.Trim();
        customer.Phone = dto.Phone.Trim();
        if (dto.CashbackPercent > 0)
            customer.CashbackPercent = dto.CashbackPercent;

        await _db.SaveChangesAsync(ct);

        return new CustomerResponseDto
        {
            Id = customer.Id,
            FullName = customer.FullName,
            Phone = customer.Phone,
            TotalDebt = customer.TotalDebt,
            CashbackBalance = customer.CashbackBalance,
            CashbackPercent = customer.CashbackPercent,
            CreatedAt = customer.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (customer == null)
            throw new NotFoundException($"ID: {id} bo'lgan mijoz topilmadi.");

        if (customer.TotalDebt > 0)
            throw new BusinessException($"Ushbu mijozning {customer.TotalDebt:N2} so'm qarzi mavjud. Qarz yopilmaguncha o'chirib bo'lmaydi.");

        var hasSales = await _db.Sales.AnyAsync(s => s.CustomerId == id, ct);
        if (hasSales)
            throw new BusinessException("Ushbu mijozga bog'liq savdo tarixi mavjud, uni o'chirib bo'lmaydi.");

        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
