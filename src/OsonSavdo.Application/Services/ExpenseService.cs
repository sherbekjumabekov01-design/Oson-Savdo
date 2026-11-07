using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class ExpenseService : IExpenseService
{
    private readonly IAppDbContext _db;

    public ExpenseService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ExpenseResponseDto>> GetAllAsync(DateTime? fromDate = null, DateTime? toDate = null, string? category = null, CancellationToken ct = default)
    {
        var query = _db.Expenses.AsNoTracking();

        if (fromDate.HasValue)
            query = query.Where(e => e.CreatedAt >= fromDate.Value.ToUniversalTime());

        if (toDate.HasValue)
            query = query.Where(e => e.CreatedAt <= toDate.Value.ToUniversalTime());

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Category.ToLower() == category.Trim().ToLower());

        return await query
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExpenseResponseDto
            {
                Id = e.Id,
                Title = e.Title,
                Amount = e.Amount,
                Category = e.Category,
                PaymentType = e.PaymentType,
                CashShiftId = e.CashShiftId,
                CreatedByName = e.CreatedByName,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync(ct);
    }

    public async Task<ExpenseResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var expense = await _db.Expenses.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, ct);
        if (expense == null)
            throw new NotFoundException($"ID: {id} bo'lgan xarajat topilmadi.");

        return new ExpenseResponseDto
        {
            Id = expense.Id,
            Title = expense.Title,
            Amount = expense.Amount,
            Category = expense.Category,
            PaymentType = expense.PaymentType,
            CashShiftId = expense.CashShiftId,
            CreatedByName = expense.CreatedByName,
            CreatedAt = expense.CreatedAt
        };
    }

    public async Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto, int? userId = null, string? cashierName = null, CancellationToken ct = default)
    {
        int? shiftId = null;
        string creator = !string.IsNullOrWhiteSpace(dto.CreatedByName)
            ? dto.CreatedByName
            : (!string.IsNullOrWhiteSpace(cashierName) ? cashierName : "Kassir");

        // Agar naqd xarajat bo'lsa va ochiq smena bo'lsa, kassadan chiqim qilib hisobga olamiz
        if (dto.PaymentType == PaymentType.Cash)
        {
            var activeShift = await _db.CashShifts.FirstOrDefaultAsync(s => s.Status == ShiftStatus.Open, ct);
            if (activeShift != null)
            {
                shiftId = activeShift.Id;
                activeShift.TotalExpensesCash += dto.Amount;
                activeShift.ExpectedCash -= dto.Amount;
                if (string.IsNullOrWhiteSpace(creator))
                    creator = activeShift.CashierName;
            }
        }

        var expense = new Expense
        {
            Title = dto.Title.Trim(),
            Amount = dto.Amount,
            Category = dto.Category.Trim(),
            PaymentType = dto.PaymentType,
            CashShiftId = shiftId,
            UserId = userId,
            CreatedByName = creator,
            CreatedAt = DateTime.UtcNow
        };

        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync(ct);

        return new ExpenseResponseDto
        {
            Id = expense.Id,
            Title = expense.Title,
            Amount = expense.Amount,
            Category = expense.Category,
            PaymentType = expense.PaymentType,
            CashShiftId = expense.CashShiftId,
            CreatedByName = expense.CreatedByName,
            CreatedAt = expense.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (expense == null)
            throw new NotFoundException($"ID: {id} bo'lgan xarajat topilmadi.");

        // Agar ochiq smenadagi naqd chiqim o'chirilsa, kassaga qaytaramiz
        if (expense.CashShiftId.HasValue && expense.PaymentType == PaymentType.Cash)
        {
            var shift = await _db.CashShifts.FirstOrDefaultAsync(s => s.Id == expense.CashShiftId.Value && s.Status == ShiftStatus.Open, ct);
            if (shift != null)
            {
                shift.TotalExpensesCash = Math.Max(0, shift.TotalExpensesCash - expense.Amount);
                shift.ExpectedCash += expense.Amount;
            }
        }

        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
