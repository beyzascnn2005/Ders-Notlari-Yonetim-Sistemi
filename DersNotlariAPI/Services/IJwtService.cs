using DersNotlariAPI.Models;

namespace DersNotlariAPI.Services
{
    public interface IJwtService
    {
        // Kullanıcı için imzalı bir JWT token üretir ve son geçerlilik tarihini de döner.
        (string Token, DateTime ExpiresAt) GenerateToken(User user);
    }
}
