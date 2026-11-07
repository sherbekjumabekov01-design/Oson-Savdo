using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Infrastructure.Configurations;

public class CashShiftConfiguration : IEntityTypeConfiguration<CashShift>
{
    public void Configure(EntityTypeBuilder<CashShift> builder)
    {
        builder.ToTable("CashShifts");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.OpeningBalance)
            .HasPrecision(18, 2);

        builder.Property(c => c.ClosingCashActual)
            .HasPrecision(18, 2);

        builder.Property(c => c.ExpectedCash)
            .HasPrecision(18, 2);

        builder.Property(c => c.CashDifference)
            .HasPrecision(18, 2);

        builder.Property(c => c.TotalCashSales)
            .HasPrecision(18, 2);

        builder.Property(c => c.TotalCardSales)
            .HasPrecision(18, 2);

        builder.Property(c => c.TotalDebtSales)
            .HasPrecision(18, 2);

        builder.Property(c => c.TotalRefunds)
            .HasPrecision(18, 2);

        builder.Property(c => c.TotalDebtRepaidCash)
            .HasPrecision(18, 2);

        builder.Property(c => c.TotalDebtRepaidCard)
            .HasPrecision(18, 2);

        builder.Property(c => c.TotalExpensesCash)
            .HasPrecision(18, 2);

        builder.Property(c => c.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.HasOne(c => c.User)
            .WithMany(u => u.CashShifts)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
