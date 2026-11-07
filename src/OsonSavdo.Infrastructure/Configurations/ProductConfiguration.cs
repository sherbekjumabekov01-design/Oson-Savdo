using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OsonSavdo.Domain.Entities;

namespace OsonSavdo.Infrastructure.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Barcode)
            .IsRequired()
            .HasMaxLength(64);

        builder.HasIndex(p => p.Barcode)
            .IsUnique();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.CostPrice)
            .HasPrecision(18, 2);

        builder.Property(p => p.SellingPrice)
            .HasPrecision(18, 2);

        builder.Property(p => p.StockQuantity)
            .HasPrecision(18, 3);

        builder.Property(p => p.MinStockAlert)
            .HasPrecision(18, 3);

        builder.Property(p => p.Unit)
            .IsRequired()
            .HasMaxLength(20);
    }
}
