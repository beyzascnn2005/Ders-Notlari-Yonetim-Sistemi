using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DersNotlariAPI.Models
{
    // Bir ders notunu temsil eder. Her not bir kullanıcıya aittir.
    public class Note
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(150)]
        public string DersAdi { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Aciklama { get; set; }

        // Yüklenen dosyanın sunucudaki fiziksel/relatif yolu (örn: /uploads/xxxx.pdf)
        public string? DosyaYolu { get; set; }

        // Kullanıcının gördüğü orijinal dosya adı (örn: "matematik-1-sinav.pdf")
        public string? DosyaAdi { get; set; }

        public DateTime EklemeTarihi { get; set; } = DateTime.UtcNow;

        public DateTime GuncellemeTarihi { get; set; } = DateTime.UtcNow;

        // Soft delete: null ise not aktif, dolu ise "silinmiş" (arşivde) demektir.
        public DateTime? DeletedAt { get; set; }

        // --- İlişki (Foreign Key) ---
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }
}
