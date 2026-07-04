using DersNotlariAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace DersNotlariAPI.Data
{
    // Uygulama ilk ayağa kalktığında veritabanı boşsa örnek veri ekler.
    // "Migration dosyaları ve seeder .NET içerisinde yer almalı" şartını karşılar.
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext db)
        {
            // Zaten kullanıcı varsa (yani daha önce seed edilmiş veya gerçek kullanıcı
            // kayıt olmuşsa) tekrar seed etme — bu metodun her uygulama başlangıcında
            // güvenle çağrılabilmesini sağlar (idempotent).
            if (await db.Users.AnyAsync())
                return;

            var demoUser = new User
            {
                Username = "demo",
                Email = "demo@example.com",
                // Şifre: Demo123!  (BCrypt ile hashlenmiş hali aşağıda üretiliyor)
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"),
                CreatedAt = DateTime.UtcNow
            };

            db.Users.Add(demoUser);
            await db.SaveChangesAsync();

            var now = DateTime.UtcNow;

            var sampleNotes = new List<Note>
            {
                new()
                {
                    UserId = demoUser.Id,
                    DersAdi = "Veri Yapıları ve Algoritmalar",
                    Aciklama = "Bağlı listeler, yığınlar ve kuyruklar üzerine haftalık ders notu.",
                    EklemeTarihi = now.AddDays(-10),
                    GuncellemeTarihi = now.AddDays(-10)
                },
                new()
                {
                    UserId = demoUser.Id,
                    DersAdi = "Veritabanı Yönetim Sistemleri",
                    Aciklama = "Normalizasyon (1NF, 2NF, 3NF) konu özeti ve örnek sorular.",
                    EklemeTarihi = now.AddDays(-7),
                    GuncellemeTarihi = now.AddDays(-5)
                },
                new()
                {
                    UserId = demoUser.Id,
                    DersAdi = "Web Programlama",
                    Aciklama = "REST API tasarım prensipleri ve HTTP durum kodları.",
                    EklemeTarihi = now.AddDays(-3),
                    GuncellemeTarihi = now.AddDays(-3)
                },
                // Arşivin de boş görünmemesi için soft-delete edilmiş bir örnek not:
                new()
                {
                    UserId = demoUser.Id,
                    DersAdi = "İşletim Sistemleri (Eski Not)",
                    Aciklama = "Bu not, arşiv özelliğini gösterebilmek için silinmiş örnek bir nottur.",
                    EklemeTarihi = now.AddDays(-20),
                    GuncellemeTarihi = now.AddDays(-15),
                    DeletedAt = now.AddDays(-2)
                }
            };

            db.Notes.AddRange(sampleNotes);
            await db.SaveChangesAsync();
        }
    }
}
