using DersNotlariAPI.Data;
using DersNotlariAPI.DTOs;
using DersNotlariAPI.Models;
using DersNotlariAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DersNotlariAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IJwtService _jwtService;

        public AuthController(AppDbContext db, IJwtService jwtService)
        {
            _db = db;
            _jwtService = jwtService;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
        {
            // ModelState, DTO üzerindeki [Required], [MinLength] vb. kuralları otomatik kontrol eder.
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kullanıcı adı veya email daha önce alınmış mı kontrol et
            var exists = await _db.Users.AnyAsync(u =>
                u.Username == dto.Username || u.Email == dto.Email);

            if (exists)
                return Conflict(new { message = "Bu kullanıcı adı veya email zaten kullanılıyor." });

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                // Şifreyi ASLA düz metin olarak kaydetmiyoruz, BCrypt ile hashliyoruz.
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var (token, expiresAt) = _jwtService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Token = token,
                ExpiresAt = expiresAt
            });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kullanıcı adı VEYA email ile giriş yapılabilsin
            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.Username == dto.UsernameOrEmail || u.Email == dto.UsernameOrEmail);

            // Güvenlik notu: kullanıcı bulunamadı ile şifre yanlış durumlarını
            // kasıtlı olarak aynı mesajla dönüyoruz. Böylece saldırgan "bu kullanıcı
            // var mı yok mu" bilgisini deneme-yanılma ile öğrenemez.
            if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Kullanıcı adı/email veya şifre hatalı." });

            var (token, expiresAt) = _jwtService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Token = token,
                ExpiresAt = expiresAt
            });
        }
    }
}
