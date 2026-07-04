using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DersNotlariAPI.Models;
using Microsoft.IdentityModel.Tokens;

namespace DersNotlariAPI.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _config;

        public JwtService(IConfiguration config)
        {
            _config = config;
        }

        public (string Token, DateTime ExpiresAt) GenerateToken(User user)
        {
            var jwtKey = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("Jwt:Key appsettings.json içinde tanımlı değil.");

            var expireMinutes = int.Parse(_config["Jwt:ExpireMinutes"] ?? "120");
            var expiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);

            // Token içine kullanıcının kimliğini claim olarak koyuyoruz.
            // "sub" (NameIdentifier) claim'i, Controller'larda "bu isteği kim yaptı" diye
            // kullanıcıyı tanımak için kullanılacak (User.Identity üzerinden okunacak).
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.Username),
                new(ClaimTypes.Email, user.Email)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            return (tokenString, expiresAt);
        }
    }
}
