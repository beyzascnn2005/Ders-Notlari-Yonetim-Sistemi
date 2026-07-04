using System.ComponentModel.DataAnnotations;

namespace DersNotlariAPI.DTOs
{
    // Kullanıcının /api/auth/login endpoint'ine gönderdiği veri
    public class LoginDto
    {
        [Required(ErrorMessage = "Kullanıcı adı veya email zorunludur.")]
        public string UsernameOrEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur.")]
        public string Password { get; set; } = string.Empty;
    }
}
