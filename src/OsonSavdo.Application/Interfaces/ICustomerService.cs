using OsonSavdo.Application.DTOs;

namespace OsonSavdo.Application.Interfaces;

public interface ICustomerService
{
    Task<IEnumerable<CustomerResponseDto>> GetAllAsync(string? search = null, CancellationToken ct = default);
    Task<CustomerResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CustomerResponseDto> CreateAsync(CreateCustomerDto dto, CancellationToken ct = default);
    Task<CustomerResponseDto> UpdateAsync(int id, UpdateCustomerDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
