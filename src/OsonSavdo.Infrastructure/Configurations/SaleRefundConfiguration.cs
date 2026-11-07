using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Infrastructure.Configurations;

public class SaleRefundConfiguration : IEntityTypeConfiguration<SaleRefund>
{
    public void Configure(EntityTypeBuilder<SaleRefund> builder)
    {
        builder.ToTable("SaleRefunds");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TotalRefundAmount)
            .HasPrecision(18, 2);

        builder.Property(r => r.CashierName)
            .HasMaxLength(128);

        builder.Property(r => r.Reason)
            .HasMaxLength(256);

        builder.HasOne(r => r.Sale)
            .WithMany(s => s.Refunds)
            .HasForeignKey(r => r.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Items)
            .WithOne(i => i.SaleRefund)
            .HasForeignKey(i => i.SaleRefundId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
