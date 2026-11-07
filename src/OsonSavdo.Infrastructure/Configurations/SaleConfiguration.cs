using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Infrastructure.Configurations;

public class SaleConfiguration : IEntityTypeConfiguration<Sale>
{
    public void Configure(EntityTypeBuilder<Sale> builder)
    {
        builder.ToTable("Sales");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.TotalAmount)
            .HasPrecision(18, 2);

        builder.Property(s => s.PaidAmount)
            .HasPrecision(18, 2);

        builder.Property(s => s.DebtAmount)
            .HasPrecision(18, 2);

        builder.Property(s => s.DiscountAmount)
            .HasPrecision(18, 2);

        builder.Property(s => s.PaidCash)
            .HasPrecision(18, 2);

        builder.Property(s => s.PaidCard)
            .HasPrecision(18, 2);

        builder.Property(s => s.PaymentType)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(s => s.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.HasOne(s => s.Customer)
            .WithMany(c => c.Sales)
            .HasForeignKey(s => s.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.CashShift)
            .WithMany(cs => cs.Sales)
            .HasForeignKey(s => s.CashShiftId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(s => s.Items)
            .WithOne(i => i.Sale)
            .HasForeignKey(i => i.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Refunds)
            .WithOne(r => r.Sale)
            .HasForeignKey(r => r.SaleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
