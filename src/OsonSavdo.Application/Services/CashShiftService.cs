using Microsoft.EntityFrameworkCore;
using OsonSavdo.Application.DTOs;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Domain.Entities;
using OsonSavdo.Domain.Enums;
using OsonSavdo.Domain.Exceptions;

namespace OsonSavdo.Application.Services;

public class CashShiftService : ICashShiftService
{
    private readonly IAppDbContext _db;
    private readonly ITelegramService? _telegramService;

    public CashShiftService(IAppDbContext db, ITelegramService? telegramService = null)
    {
        _db = db;
        _telegramService = telegramService;
    }

    public async Task<CurrentShiftSummaryDto> GetCurrentShiftAsync(CancellationToken ct = default)
    {
        var activeShift = await _db.CashShifts
            .Include(s => s.Sales)
            .FirstOrDefaultAsync(s => s.Status == ShiftStatus.Open, ct);

        if (activeShift == null)
        {
            return new CurrentShiftSummaryDto(IsOpen: false, Shift: null, CurrentCalculatedCash: 0);
        }

        // Real vaqtdagi naqd savdo va qaytarishlar
        var cashSales = activeShift.Sales.Where(s => s.Status != SaleStatus.Refunded).Sum(s => s.PaidCash > 0 ? s.PaidCash : (s.PaymentType == PaymentType.Cash ? s.PaidAmount : 0));
        var cardSales = activeShift.Sales.Where(s => s.Status != SaleStatus.Refunded).Sum(s => s.PaidCard > 0 ? s.PaidCard : (s.PaymentType == PaymentType.Card ? s.PaidAmount : 0));
        var debtSales = activeShift.Sales.Where(s => s.Status != SaleStatus.Refunded).Sum(s => s.DebtAmount);

        var debtRepaidCash = await _db.DebtTransactions
            .Where(dt => dt.CashShiftId == activeShift.Id && dt.Type == TransactionType.RepayDebt && dt.PaymentType == PaymentType.Cash)
            .SumAsync(dt => dt.Amount, ct);

        var debtRepaidCard = await _db.DebtTransactions
            .Where(dt => dt.CashShiftId == activeShift.Id && dt.Type == TransactionType.RepayDebt && dt.PaymentType == PaymentType.Card)
            .SumAsync(dt => dt.Amount, ct);

        var expensesCash = await _db.Expenses
            .Where(e => e.CashShiftId == activeShift.Id && e.PaymentType == PaymentType.Cash)
            .SumAsync(e => e.Amount, ct);

        var cashIn = await _db.CashOperations
            .Where(co => co.CashShiftId == activeShift.Id && co.Type == CashOperationType.CashIn)
            .SumAsync(co => co.Amount, ct);

        var cashOut = await _db.CashOperations
            .Where(co => co.CashShiftId == activeShift.Id && co.Type == CashOperationType.CashOut)
            .SumAsync(co => co.Amount, ct);

        activeShift.TotalCashSales = cashSales;
        activeShift.TotalCardSales = cardSales;
        activeShift.TotalDebtSales = debtSales;
        activeShift.TotalSalesCount = activeShift.Sales.Count;
        activeShift.TotalDebtRepaidCash = debtRepaidCash;
        activeShift.TotalDebtRepaidCard = debtRepaidCard;
        activeShift.TotalExpensesCash = expensesCash;
        activeShift.TotalCashIn = cashIn;
        activeShift.TotalCashOut = cashOut;

        var currentCash = activeShift.OpeningBalance + cashSales + debtRepaidCash - activeShift.TotalRefunds - expensesCash + cashIn - cashOut;
        activeShift.ExpectedCash = currentCash;

        return new CurrentShiftSummaryDto(
            IsOpen: true,
            Shift: MapToDto(activeShift),
            CurrentCalculatedCash: currentCash
        );
    }

    public async Task<CashShiftResponseDto> OpenShiftAsync(int userId, string cashierName, OpenShiftDto dto, CancellationToken ct = default)
    {
        var existingOpen = await _db.CashShifts.AnyAsync(s => s.Status == ShiftStatus.Open, ct);
        if (existingOpen)
            throw new BusinessException("Hozirda ochiq kassa smenasi mavjud. Yangisini ochishdan oldin amaldagi smenani yoping.");

        if (dto.OpeningBalance < 0)
            throw new BusinessException("Boshlang'ich kassa qoldig'i manfiy bo'lishi mumkin emas.");

        var shift = new CashShift
        {
            UserId = userId > 0 ? userId : 1,
            CashierName = !string.IsNullOrWhiteSpace(cashierName) ? cashierName : "Kassir",
            OpenedAt = DateTime.UtcNow,
            OpeningBalance = dto.OpeningBalance,
            ExpectedCash = dto.OpeningBalance,
            Status = ShiftStatus.Open,
            Note = dto.Note
        };

        _db.CashShifts.Add(shift);
        await _db.SaveChangesAsync(ct);

        return MapToDto(shift);
    }

    public async Task<CashShiftResponseDto> CloseShiftAsync(int shiftId, CloseShiftDto dto, CancellationToken ct = default)
    {
        var shift = await _db.CashShifts
            .Include(s => s.Sales)
            .FirstOrDefaultAsync(s => s.Id == shiftId, ct);

        if (shift == null)
            throw new NotFoundException($"ID: {shiftId} bo'lgan kassa smenasi topilmadi.");

        if (shift.Status == ShiftStatus.Closed)
            throw new BusinessException("Ushbu smena allaqachon yopilgan.");

        var cashSales = shift.Sales.Where(s => s.Status != SaleStatus.Refunded).Sum(s => s.PaidCash > 0 ? s.PaidCash : (s.PaymentType == PaymentType.Cash ? s.PaidAmount : 0));
        var cardSales = shift.Sales.Where(s => s.Status != SaleStatus.Refunded).Sum(s => s.PaidCard > 0 ? s.PaidCard : (s.PaymentType == PaymentType.Card ? s.PaidAmount : 0));
        var debtSales = shift.Sales.Where(s => s.Status != SaleStatus.Refunded).Sum(s => s.DebtAmount);

        shift.TotalCashSales = cashSales;
        shift.TotalCardSales = cardSales;
        shift.TotalDebtSales = debtSales;
        shift.TotalSalesCount = shift.Sales.Count;

        var debtRepaidCash = await _db.DebtTransactions
            .Where(dt => dt.CashShiftId == shiftId && dt.Type == TransactionType.RepayDebt && dt.PaymentType == PaymentType.Cash)
            .SumAsync(dt => dt.Amount, ct);

        var debtRepaidCard = await _db.DebtTransactions
            .Where(dt => dt.CashShiftId == shiftId && dt.Type == TransactionType.RepayDebt && dt.PaymentType == PaymentType.Card)
            .SumAsync(dt => dt.Amount, ct);

        var expensesCash = await _db.Expenses
            .Where(e => e.CashShiftId == shiftId && e.PaymentType == PaymentType.Cash)
            .SumAsync(e => e.Amount, ct);

        var cashIn = await _db.CashOperations
            .Where(co => co.CashShiftId == shiftId && co.Type == CashOperationType.CashIn)
            .SumAsync(co => co.Amount, ct);

        var cashOut = await _db.CashOperations
            .Where(co => co.CashShiftId == shiftId && co.Type == CashOperationType.CashOut)
            .SumAsync(co => co.Amount, ct);

        shift.TotalDebtRepaidCash = debtRepaidCash;
        shift.TotalDebtRepaidCard = debtRepaidCard;
        shift.TotalExpensesCash = expensesCash;
        shift.TotalCashIn = cashIn;
        shift.TotalCashOut = cashOut;

        shift.ClosingCashActual = dto.ClosingCashActual;
        shift.ExpectedCash = shift.OpeningBalance + cashSales + debtRepaidCash - shift.TotalRefunds - expensesCash + cashIn - cashOut;
        shift.CashDifference = shift.ClosingCashActual - shift.ExpectedCash;
        shift.Status = ShiftStatus.Closed;
        shift.ClosedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            shift.Note = string.IsNullOrWhiteSpace(shift.Note) ? dto.Note : $"{shift.Note} | {dto.Note}";
        }

        await _db.SaveChangesAsync(ct);

        if (_telegramService != null)
        {
            try
            {
                var store = await _db.Stores.FirstOrDefaultAsync(st => st.Id == (shift.StoreId ?? 1), ct);
                if (store != null)
                {
                    await _telegramService.SendShiftClosedReportAsync(shift, store, ct);
                }
            }
            catch
            {
                // Telegram xatosi kassa yopilishini to'xtatmaydi
            }
        }

        return MapToDto(shift);
    }

    public async Task<List<CashShiftResponseDto>> GetShiftHistoryAsync(int limit = 30, CancellationToken ct = default)
    {
        return await _db.CashShifts
            .AsNoTracking()
            .OrderByDescending(s => s.OpenedAt)
            .Take(limit)
            .Select(s => MapToDto(s))
            .ToListAsync(ct);
    }

    public async Task<CashShiftResponseDto?> GetActiveShiftEntityAsync(CancellationToken ct = default)
    {
        var shift = await _db.CashShifts
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Status == ShiftStatus.Open, ct);

        return shift == null ? null : MapToDto(shift);
    }

    public async Task<CashOperationResponseDto> AddCashOperationAsync(int shiftId, CreateCashOperationDto dto, string performedBy, CancellationToken ct = default)
    {
        var shift = await _db.CashShifts.FirstOrDefaultAsync(s => s.Id == shiftId, ct);
        if (shift == null)
            throw new NotFoundException("Kassa smenasi topilmadi.");

        if (shift.Status != ShiftStatus.Open)
            throw new BusinessException("Faqat ochiq smenada kassa amallarini bajarish mumkin.");

        if (dto.Amount <= 0)
            throw new BusinessException("Summa 0 dan katta bo'lishi kerak.");

        var op = new CashOperation
        {
            CashShiftId = shiftId,
            Type = dto.Type,
            Amount = dto.Amount,
            Reason = string.IsNullOrWhiteSpace(dto.Reason)
                ? (dto.Type == CashOperationType.CashIn ? "Kassaga pul kiritildi (Vnesenie)" : "Kassadan pul olindi (Inkassatsiya)")
                : dto.Reason,
            PerformedBy = string.IsNullOrWhiteSpace(performedBy) ? "Kassir" : performedBy,
            CreatedAt = DateTime.UtcNow,
            StoreId = shift.StoreId
        };

        _db.CashOperations.Add(op);
        await _db.SaveChangesAsync(ct);

        return new CashOperationResponseDto(
            Id: op.Id,
            CashShiftId: op.CashShiftId,
            Type: op.Type,
            Amount: op.Amount,
            Reason: op.Reason,
            PerformedBy: op.PerformedBy,
            CreatedAt: op.CreatedAt
        );
    }

    public async Task<List<CashOperationResponseDto>> GetShiftOperationsAsync(int shiftId, CancellationToken ct = default)
    {
        return await _db.CashOperations
            .AsNoTracking()
            .Where(o => o.CashShiftId == shiftId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new CashOperationResponseDto(
                o.Id,
                o.CashShiftId,
                o.Type,
                o.Amount,
                o.Reason,
                o.PerformedBy,
                o.CreatedAt
            ))
            .ToListAsync(ct);
    }

    private static CashShiftResponseDto MapToDto(CashShift s) => new(
        Id: s.Id,
        UserId: s.UserId,
        CashierName: s.CashierName,
        OpenedAt: s.OpenedAt,
        ClosedAt: s.ClosedAt,
        OpeningBalance: s.OpeningBalance,
        ClosingCashActual: s.ClosingCashActual,
        ExpectedCash: s.ExpectedCash,
        CashDifference: s.CashDifference,
        TotalCashSales: s.TotalCashSales,
        TotalCardSales: s.TotalCardSales,
        TotalDebtSales: s.TotalDebtSales,
        TotalRefunds: s.TotalRefunds,
        TotalSalesCount: s.TotalSalesCount,
        Status: s.Status,
        Note: s.Note,
        TotalDebtRepaidCash: s.TotalDebtRepaidCash,
        TotalDebtRepaidCard: s.TotalDebtRepaidCard,
        TotalExpensesCash: s.TotalExpensesCash,
        TotalCashIn: s.TotalCashIn,
        TotalCashOut: s.TotalCashOut
    );
}
