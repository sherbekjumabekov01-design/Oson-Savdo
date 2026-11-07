using Microsoft.Extensions.DependencyInjection;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Application.Services;

namespace OsonSavdo.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ISaleService, SaleService>();
        services.AddScoped<IDebtService, DebtService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICashShiftService, CashShiftService>();
        services.AddScoped<ISupplyService, SupplyService>();
        services.AddScoped<IRefundService, RefundService>();
        services.AddScoped<IStoreService, StoreService>();
        services.AddScoped<IAuditService, AuditService>();

        return services;
    }
}
