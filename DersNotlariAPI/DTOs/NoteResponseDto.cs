namespace DersNotlariAPI.DTOs
{
    // API'den frontend'e dönen not verisi
    public class NoteResponseDto
    {
        public Guid Id { get; set; }
        public string DersAdi { get; set; } = string.Empty;
        public string? Aciklama { get; set; }

        // Dosyanın tarayıcıdan doğrudan erişilebileceği tam URL (örn: https://.../uploads/xxxx.pdf)
        public string? DosyaUrl { get; set; }
        public string? DosyaAdi { get; set; }

        public DateTime EklemeTarihi { get; set; }
        public DateTime GuncellemeTarihi { get; set; }

        // Sadece arşiv listesinde dolu gelir; aktif not listesinde her zaman null'dur.
        public DateTime? DeletedAt { get; set; }
    }
}
