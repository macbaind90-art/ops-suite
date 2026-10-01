using System;
using System.Security.Cryptography;

namespace PWADC.SecurityOperationsSuite;

internal static class PinCredential
{
    public static string Hash(string pin)
    {
        if (pin.Length < 4 || pin.Length > 8 || !System.Linq.Enumerable.All(pin, char.IsDigit))
            throw new ArgumentException("PIN must contain 4 to 8 digits.");
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(pin, salt, 210000, HashAlgorithmName.SHA256, 32);
        return "pbkdf2-sha256$210000$" + Convert.ToBase64String(salt) + "$" + Convert.ToBase64String(hash);
    }
    public static bool Verify(string pin, string credential)
    {
        try
        {
            string[] parts = credential.Split('$');
            if (parts.Length != 4 || parts[0] != "pbkdf2-sha256" || parts[1] != "210000") return false;
            byte[] expected = Convert.FromBase64String(parts[3]);
            byte[] actual = Rfc2898DeriveBytes.Pbkdf2(pin, Convert.FromBase64String(parts[2]), 210000, HashAlgorithmName.SHA256, 32);
            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch { return false; }
    }
}
