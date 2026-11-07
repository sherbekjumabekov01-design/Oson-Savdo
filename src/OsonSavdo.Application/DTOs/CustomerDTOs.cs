using System.ComponentModel.DataAnnotations;

namespace OsonSavdo.Application.DTOs;

public record CreateCustomerDto
{
    [Required(ErrorMessage = "Mijoz ismi majburiy")]
    [MaxLength(150)]
    public string FullName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Telefon raqami majburiy")]
    [MaxLength(30)]
    public string Phone { get; init; } = string.Empty;

    public decimal CashbackPercent { get; init; } = 1.0m;
}

public record UpdateCustomerDto
{
    [Required(ErrorMessage = "Mijoz ismi majburiy")]
    [MaxLength(150)]
    public string FullName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Telefon raqami majburiy")]
    [MaxLength(30)]
    public string Phone { get; init; } = string.Empty;

    public decimal CashbackPercent { get; init; } = 1.0m;
}

public record CustomerResponseDto
{
    public int Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public decimal TotalDebt { get; init; }
    public decimal CashbackBalance { get; init; }
    public decimal CashbackPercent { get; init; }
    public DateTime CreatedAt { get; init; }
}
