using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Infrastructure.Configurations;

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("Expenses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Amount)
            .HasPrecision(18, 2);

        builder.Property(e => e.CreatedByName)
            .HasMaxLength(100);

        builder.Property(e => e.PaymentType)
            .HasConversion<int>()
            .IsRequired();

        builder.HasOne(e => e.CashShift)
            .WithMany(s => s.Expenses)
            .HasForeignKey(e => e.CashShiftId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
