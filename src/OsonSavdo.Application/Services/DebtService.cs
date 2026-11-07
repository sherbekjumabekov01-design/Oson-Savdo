using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class DebtService : IDebtService
{
    private readonly IAppDbContext _db;

    public DebtService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<DebtTransactionResponseDto> RepayDebtAsync(RepayDebtDto dto, CancellationToken ct = default)
    {
        if (dto.Amount <= 0)
            throw new BusinessException("To'lov summasi 0 dan katta bo'lishi shart.");

        using var transaction = await _db.BeginTransactionAsync(ct);

        try
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == dto.CustomerId, ct);
            if (customer == null)
                throw new NotFoundException($"ID: {dto.CustomerId} bo'lgan mijoz topilmadi.");

            var previousDebt = customer.TotalDebt;

            // Mijoz qarz balansini kamaytirish
            customer.TotalDebt -= dto.Amount;
            var remainingDebt = customer.TotalDebt;

            // Ochiq kassa smenasini aniqlash (agar berilmagan bo'lsa)
            int? shiftId = dto.CashShiftId;
            if (!shiftId.HasValue)
            {
                var activeShift = await _db.CashShifts.FirstOrDefaultAsync(s => s.Status == ShiftStatus.Open, ct);
                shiftId = activeShift?.Id;
            }

            var debtTx = new DebtTransaction
            {
                CustomerId = customer.Id,
                Amount = dto.Amount,
                Type = TransactionType.RepayDebt,
                PaymentType = dto.PaymentType,
                PreviousDebt = previousDebt,
                RemainingDebt = remainingDebt,
                CashShiftId = shiftId,
                CashierName = !string.IsNullOrWhiteSpace(dto.CashierName) ? dto.CashierName.Trim() : "Kassir",
                Note = string.IsNullOrWhiteSpace(dto.Note) ? "Qarz to'landi" : dto.Note.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _db.DebtTransactions.Add(debtTx);
            await _db.SaveChangesAsync(ct);

            await transaction.CommitAsync(ct);

            return new DebtTransactionResponseDto
            {
                Id = debtTx.Id,
                CustomerId = customer.Id,
                CustomerName = customer.FullName,
                CustomerPhone = customer.Phone,
                Amount = debtTx.Amount,
                Type = debtTx.Type,
                PaymentType = debtTx.PaymentType,
                PreviousDebt = previousDebt,
                RemainingDebt = remainingDebt,
                CashShiftId = debtTx.CashShiftId,
                CashierName = debtTx.CashierName,
                Note = debtTx.Note,
                CreatedAt = debtTx.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<CustomerDebtSummaryDto> GetCustomerDebtSummaryAsync(int customerId, CancellationToken ct = default)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, ct);

        if (customer == null)
            throw new NotFoundException($"ID: {customerId} bo'lgan mijoz topilmadi.");

        var lastTx = await _db.DebtTransactions
            .AsNoTracking()
            .Where(t => t.CustomerId == customerId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => (DateTime?)t.CreatedAt)
            .FirstOrDefaultAsync(ct);

        return new CustomerDebtSummaryDto
        {
            CustomerId = customer.Id,
            CustomerName = customer.FullName,
            Phone = customer.Phone,
            TotalDebt = customer.TotalDebt,
            LastTransactionDate = lastTx
        };
    }

    public async Task<IEnumerable<CustomerDebtSummaryDto>> GetAllDebtorsAsync(CancellationToken ct = default)
    {
        return await _db.Customers
            .AsNoTracking()
            .Where(c => c.TotalDebt > 0)
            .OrderByDescending(c => c.TotalDebt)
            .Select(c => new CustomerDebtSummaryDto
            {
                CustomerId = c.Id,
                CustomerName = c.FullName,
                Phone = c.Phone,
                TotalDebt = c.TotalDebt,
                LastTransactionDate = c.DebtTransactions.OrderByDescending(t => t.CreatedAt).Select(t => (DateTime?)t.CreatedAt).FirstOrDefault()
            })
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<DebtTransactionResponseDto>> GetCustomerTransactionsAsync(int customerId, CancellationToken ct = default)
    {
        var customerExists = await _db.Customers.AnyAsync(c => c.Id == customerId, ct);
        if (!customerExists)
            throw new NotFoundException($"ID: {customerId} bo'lgan mijoz topilmadi.");

        return await _db.DebtTransactions
            .AsNoTracking()
            .Where(t => t.CustomerId == customerId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new DebtTransactionResponseDto
            {
                Id = t.Id,
                CustomerId = t.CustomerId,
                CustomerName = t.Customer.FullName,
                CustomerPhone = t.Customer.Phone,
                Amount = t.Amount,
                Type = t.Type,
                PaymentType = t.PaymentType,
                PreviousDebt = t.PreviousDebt,
                RemainingDebt = t.RemainingDebt,
                CashShiftId = t.CashShiftId,
                CashierName = t.CashierName,
                Note = t.Note,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync(ct);
    }
}
