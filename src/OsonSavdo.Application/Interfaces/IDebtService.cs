using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface IDebtService
{
    Task<DebtTransactionResponseDto> RepayDebtAsync(RepayDebtDto dto, CancellationToken ct = default);
    Task<CustomerDebtSummaryDto> GetCustomerDebtSummaryAsync(int customerId, CancellationToken ct = default);
    Task<IEnumerable<CustomerDebtSummaryDto>> GetAllDebtorsAsync(CancellationToken ct = default);
    Task<IEnumerable<DebtTransactionResponseDto>> GetCustomerTransactionsAsync(int customerId, CancellationToken ct = default);
}
