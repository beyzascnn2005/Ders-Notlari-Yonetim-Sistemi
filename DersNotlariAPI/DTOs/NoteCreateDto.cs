using System.ComponentModel.DataAnnotations;

namespace DersNotlariAPI.DTOs
{
    // POST /api/notes isteğinde gönderilen veri (multipart/form-data, dosya içerebilir)
    public class NoteCreateDto
    {
        [Required(ErrorMessage = "Ders adı zorunludur.")]
        [MaxLength(150)]
        public string DersAdi { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Aciklama { get; set; }

        // Dosya zorunlu değil; not sadece metin olarak da eklenebilir.
        public IFormFile? Dosya { get; set; }
    }
}
