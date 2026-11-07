using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OsonSavdo.Application.Interfaces;
using OsonSavdo.Infrastructure.Data;

namespace OsonSavdo.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = configuration["DatabaseProvider"] ?? "Sqlite";

        if (provider.Equals("PostgreSql", StringComparison.OrdinalIgnoreCase) ||
            provider.Equals("Supabase", StringComparison.OrdinalIgnoreCase))
        {
            var connectionString = configuration.GetConnectionString("PostgreSqlConnection") 
                ?? configuration.GetConnectionString("SupabaseConnection")
                ?? configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("PostgreSql/Supabase connection string not found.");

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=osonsavdo.db";
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(connectionString));
        }

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<ITelegramService, Services.TelegramService>();
        services.AddScoped<IBackupService, Services.BackupService>();

        return services;
    }
}
