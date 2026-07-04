using System.ComponentModel.DataAnnotations;

namespace DersNotlariAPI.DTOs
{
    // PUT /api/notes/{id} isteğinde gönderilen veri
    public class NoteUpdateDto
    {
        [Required(ErrorMessage = "Ders adı zorunludur.")]
        [MaxLength(150)]
        public string DersAdi { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Aciklama { get; set; }

        // Yeni dosya gönderilirse eskisinin yerine geçer; gönderilmezse mevcut dosya korunur.
        public IFormFile? Dosya { get; set; }
    }
}
