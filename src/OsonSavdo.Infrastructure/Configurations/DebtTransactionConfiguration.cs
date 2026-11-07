using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Infrastructure.Configurations;

public class DebtTransactionConfiguration : IEntityTypeConfiguration<DebtTransaction>
{
    public void Configure(EntityTypeBuilder<DebtTransaction> builder)
    {
        builder.ToTable("DebtTransactions");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Amount)
            .HasPrecision(18, 2);

        builder.Property(t => t.PreviousDebt)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(t => t.RemainingDebt)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(t => t.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(t => t.PaymentType)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(t => t.CashierName)
            .HasMaxLength(150);

        builder.Property(t => t.Note)
            .HasMaxLength(500);

        builder.HasOne(t => t.Customer)
            .WithMany(c => c.DebtTransactions)
            .HasForeignKey(t => t.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.CashShift)
            .WithMany(cs => cs.DebtTransactions)
            .HasForeignKey(t => t.CashShiftId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
