namespace DersNotlariAPI.Services
{
    public class FileStorageService
    {
        private readonly IWebHostEnvironment _env;

        // İzin verilen dosya uzantıları — proje tanımında "PDF, Word, vb." deniyor,
        // güvenlik açısından her uzantıya değil, tanımlı bir listeye izin veriyoruz.
        private static readonly string[] AllowedExtensions = { ".pdf", ".doc", ".docx", ".txt" };
        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

        public FileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        private string UploadsFolder =>
            Path.Combine(_env.ContentRootPath, "Uploads");

        // Dosyayı diske kaydeder, veritabanında saklanacak (yol, orijinal ad) çiftini döner.
        // Geçersiz dosya durumunda hata fırlatır; controller bunu 400 olarak yakalayacak.
        public async Task<(string DosyaYolu, string DosyaAdi)> SaveAsync(IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!AllowedExtensions.Contains(extension))
                throw new InvalidOperationException(
                    $"Desteklenmeyen dosya türü: {extension}. İzin verilenler: {string.Join(", ", AllowedExtensions)}");

            if (file.Length > MaxFileSizeBytes)
                throw new InvalidOperationException("Dosya boyutu 10 MB'ı geçemez.");

            if (!Directory.Exists(UploadsFolder))
                Directory.CreateDirectory(UploadsFolder);

            // Aynı isimli dosyaların üzerine yazılmaması için benzersiz bir isimle kaydediyoruz,
            // kullanıcının gördüğü orijinal ismi ise ayrıca DosyaAdi olarak saklıyoruz.
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var fullPath = Path.Combine(UploadsFolder, uniqueFileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Veritabanında sadece relatif yolu tutuyoruz (Program.cs'te /uploads olarak servis ediliyor)
            var dosyaYolu = $"/uploads/{uniqueFileName}";
            return (dosyaYolu, file.FileName);
        }

        // Bir notun dosyasını diskten siler (hard delete veya dosya değiştirme sırasında kullanılır).
        public void Delete(string? dosyaYolu)
        {
            if (string.IsNullOrWhiteSpace(dosyaYolu))
                return;

            var fileName = Path.GetFileName(dosyaYolu);
            var fullPath = Path.Combine(UploadsFolder, fileName);

            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
    }
}
