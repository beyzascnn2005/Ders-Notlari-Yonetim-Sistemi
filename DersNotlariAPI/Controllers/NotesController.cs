using System.Security.Claims;
using DersNotlariAPI.Data;
using DersNotlariAPI.DTOs;
using DersNotlariAPI.Models;
using DersNotlariAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DersNotlariAPI.Controllers
{
    // [Authorize]: bu controller'daki HİÇBİR endpoint'e, geçerli bir JWT token
    // olmadan erişilemez. Token yoksa/geçersizse otomatik 401 döner.
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly FileStorageService _fileStorage;

        public NotesController(AppDbContext db, FileStorageService fileStorage)
        {
            _db = db;
            _fileStorage = fileStorage;
        }

        // Token içindeki "sub" (NameIdentifier) claim'inden giriş yapan kullanıcının ID'sini okur.
        // Bu sayede her endpoint "acaba bu not gerçekten bu kullanıcıya mı ait" diye kontrol edebiliyor.
        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private string? BuildFileUrl(string? dosyaYolu)
        {
            if (string.IsNullOrWhiteSpace(dosyaYolu))
                return null;
            return $"{Request.Scheme}://{Request.Host}{dosyaYolu}";
        }

        private NoteResponseDto ToDto(Note note) => new()
        {
            Id = note.Id,
            DersAdi = note.DersAdi,
            Aciklama = note.Aciklama,
            DosyaUrl = BuildFileUrl(note.DosyaYolu),
            DosyaAdi = note.DosyaAdi,
            EklemeTarihi = note.EklemeTarihi,
            GuncellemeTarihi = note.GuncellemeTarihi,
            DeletedAt = note.DeletedAt
        };

        // GET /api/notes  →  giriş yapan kullanıcının AKTİF (silinmemiş) notları
        [HttpGet]
        public async Task<ActionResult<List<NoteResponseDto>>> GetAll()
        {
            var notes = await _db.Notes
                .Where(n => n.UserId == CurrentUserId && n.DeletedAt == null)
                .OrderByDescending(n => n.GuncellemeTarihi)
                .ToListAsync();

            return Ok(notes.Select(ToDto));
        }

        // GET /api/notes/archive  →  giriş yapan kullanıcının silinmiş (arşivdeki) notları
        [HttpGet("archive")]
        public async Task<ActionResult<List<NoteResponseDto>>> GetArchive()
        {
            var notes = await _db.Notes
                .Where(n => n.UserId == CurrentUserId && n.DeletedAt != null)
                .OrderByDescending(n => n.DeletedAt)
                .ToListAsync();

            return Ok(notes.Select(ToDto));
        }

        // GET /api/notes/{id}  →  tek bir notun detayı
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<NoteResponseDto>> GetById(Guid id)
        {
            var note = await _db.Notes
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == CurrentUserId);

            // Not bulunamadıysa VEYA başka bir kullanıcıya aitse aynı 404'ü döneriz.
            // Böylece "bu ID var ama sana ait değil" bilgisini dışarı sızdırmayız.
            if (note is null)
                return NotFound(new { message = "Not bulunamadı." });

            return Ok(ToDto(note));
        }

        // POST /api/notes  →  yeni not ekleme (multipart/form-data, dosya opsiyonel)
        [HttpPost]
        public async Task<ActionResult<NoteResponseDto>> Create([FromForm] NoteCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var note = new Note
            {
                UserId = CurrentUserId,
                DersAdi = dto.DersAdi,
                Aciklama = dto.Aciklama,
                EklemeTarihi = DateTime.UtcNow,
                GuncellemeTarihi = DateTime.UtcNow
            };

            if (dto.Dosya is not null)
            {
                try
                {
                    var (dosyaYolu, dosyaAdi) = await _fileStorage.SaveAsync(dto.Dosya);
                    note.DosyaYolu = dosyaYolu;
                    note.DosyaAdi = dosyaAdi;
                }
                catch (InvalidOperationException ex)
                {
                    return BadRequest(new { message = ex.Message });
                }
            }

            _db.Notes.Add(note);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = note.Id }, ToDto(note));
        }

        // PUT /api/notes/{id}  →  mevcut notu güncelleme
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<NoteResponseDto>> Update(Guid id, [FromForm] NoteUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Arşivdeki (silinmiş) bir not güncellenemesin diye DeletedAt == null şartını da koyuyoruz.
            var note = await _db.Notes
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == CurrentUserId && n.DeletedAt == null);

            if (note is null)
                return NotFound(new { message = "Not bulunamadı." });

            note.DersAdi = dto.DersAdi;
            note.Aciklama = dto.Aciklama;
            note.GuncellemeTarihi = DateTime.UtcNow;

            if (dto.Dosya is not null)
            {
                try
                {
                    var (dosyaYolu, dosyaAdi) = await _fileStorage.SaveAsync(dto.Dosya);

                    // Eski dosyayı diskten temizle, artık kullanılmıyor.
                    _fileStorage.Delete(note.DosyaYolu);

                    note.DosyaYolu = dosyaYolu;
                    note.DosyaAdi = dosyaAdi;
                }
                catch (InvalidOperationException ex)
                {
                    return BadRequest(new { message = ex.Message });
                }
            }

            await _db.SaveChangesAsync();
            return Ok(ToDto(note));
        }

        // DELETE /api/notes/{id}  →  SOFT DELETE: sadece DeletedAt işaretlenir, veri durur.
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> SoftDelete(Guid id)
        {
            var note = await _db.Notes
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == CurrentUserId && n.DeletedAt == null);

            if (note is null)
                return NotFound(new { message = "Not bulunamadı." });

            note.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // POST /api/notes/{id}/restore  →  arşivdeki notu geri getirir (bonus, spesifikasyonda
        // zorunlu değil ama arşiv mantığının doğal bir parçası, mülakatta artı puan olabilir)
        [HttpPost("{id:guid}/restore")]
        public async Task<ActionResult<NoteResponseDto>> Restore(Guid id)
        {
            var note = await _db.Notes
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == CurrentUserId && n.DeletedAt != null);

            if (note is null)
                return NotFound(new { message = "Arşivde böyle bir not bulunamadı." });

            note.DeletedAt = null;
            note.GuncellemeTarihi = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(ToDto(note));
        }

        // DELETE /api/notes/{id}/hard  →  HARD DELETE: yalnızca arşivdeki (DeletedAt dolu) bir
        // not için çalışır, veritabanından ve diskten kalıcı olarak siler.
        [HttpDelete("{id:guid}/hard")]
        public async Task<IActionResult> HardDelete(Guid id)
        {
            var note = await _db.Notes
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == CurrentUserId && n.DeletedAt != null);

            if (note is null)
                return NotFound(new { message = "Arşivde böyle bir not bulunamadı. (Not: bir notu kalıcı silmeden önce önce arşive taşımalısınız.)" });

            _fileStorage.Delete(note.DosyaYolu);
            _db.Notes.Remove(note);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
