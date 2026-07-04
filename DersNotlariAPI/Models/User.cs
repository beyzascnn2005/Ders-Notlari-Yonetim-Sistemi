using System.ComponentModel.DataAnnotations;

namespace DersNotlariAPI.Models
{
    // Sisteme kayıt olan kullanıcıyı temsil eder.
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        // Şifre hiçbir zaman düz metin olarak tutulmaz, BCrypt ile hash'lenir.
        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property: bir kullanıcının birden çok notu olabilir.
        public ICollection<Note> Notes { get; set; } = new List<Note>();
    }
}
