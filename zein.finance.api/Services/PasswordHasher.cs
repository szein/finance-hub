using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using System.Security.Cryptography;

public static class PasswordHasher
{
    public static (string Hash, string Salt) HashPassword(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var hashBytes = KeyDerivation.Pbkdf2(
            password,
            saltBytes,
            KeyDerivationPrf.HMACSHA256,
            100_000,
            32);

        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
    }

    public static bool Verify(string password, string storedHash, string storedSalt)
    {
        try
        {
            var saltBytes = Convert.FromBase64String(storedSalt);
            var hashBytes = KeyDerivation.Pbkdf2(
                password,
                saltBytes,
                KeyDerivationPrf.HMACSHA256,
                100_000,
                32);

            var storedHashBytes = Convert.FromBase64String(storedHash);
            return CryptographicOperations.FixedTimeEquals(hashBytes, storedHashBytes);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
