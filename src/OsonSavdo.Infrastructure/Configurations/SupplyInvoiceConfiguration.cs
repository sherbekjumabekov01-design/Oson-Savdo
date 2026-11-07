using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Infrastructure.Configurations;

public class SupplyInvoiceConfiguration : IEntityTypeConfiguration<SupplyInvoice>
{
    public void Configure(EntityTypeBuilder<SupplyInvoice> builder)
    {
        builder.ToTable("SupplyInvoices");

        builder.HasKey(si => si.Id);

        builder.Property(si => si.InvoiceNumber)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(si => si.TotalAmount)
            .HasPrecision(18, 2);

        builder.Property(si => si.PaidAmount)
            .HasPrecision(18, 2);

        builder.Property(si => si.DebtAmount)
            .HasPrecision(18, 2);

        builder.HasOne(si => si.Supplier)
            .WithMany(s => s.Invoices)
            .HasForeignKey(si => si.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(si => si.Items)
            .WithOne(i => i.SupplyInvoice)
            .HasForeignKey(i => i.SupplyInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
