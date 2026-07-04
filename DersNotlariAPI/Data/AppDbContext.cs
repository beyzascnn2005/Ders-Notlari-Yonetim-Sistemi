using DersNotlariAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace DersNotlariAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Note> Notes => Set<Note>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // SQL Server, DateTime değerlerini "hangi saat diliminde" bilgisiyle saklamaz.
            // Biz her yerde UtcNow kullandığımız için, veritabanından geri okunan her
            // DateTime'ı burada açıkça "Kind = Utc" olarak işaretliyoruz. Böylece frontend'e
            // JSON olarak giderken sonuna "Z" ekleniyor ve tarayıcı doğru şekilde kendi yerel
            // saatine çeviriyor. Bu olmazsa tarayıcı UTC saatini yerel saat sanıp yanlış gösterir.
            var utcConverter = new ValueConverter<DateTime, DateTime>(
                toDb => toDb,
                fromDb => DateTime.SpecifyKind(fromDb, DateTimeKind.Utc));

            var nullableUtcConverter = new ValueConverter<DateTime?, DateTime?>(
                toDb => toDb,
                fromDb => fromDb.HasValue ? DateTime.SpecifyKind(fromDb.Value, DateTimeKind.Utc) : fromDb);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                        property.SetValueConverter(utcConverter);
                    else if (property.ClrType == typeof(DateTime?))
                        property.SetValueConverter(nullableUtcConverter);
                }
            }

            // Kullanıcı adı ve email benzersiz olmalı
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Bir kullanıcı silinirse notları da silinsin (cascade)
            modelBuilder.Entity<Note>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notes)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Sık kullanılan sorgular için index: kullanıcıya göre + silinme durumuna göre filtreleme
            modelBuilder.Entity<Note>()
                .HasIndex(n => new { n.UserId, n.DeletedAt });
        }
    }
}