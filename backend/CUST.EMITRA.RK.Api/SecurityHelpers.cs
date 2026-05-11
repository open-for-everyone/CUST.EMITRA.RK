using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;

static class PasswordHasher
{
    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        const int iterations = 600_000;
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, 32);
        return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string storedHash)
    {
        var parts = storedHash.Split('.', 3);
        if (parts.Length != 3 || !int.TryParse(parts[0], out var iterations))
        {
            return false;
        }

        var salt = Convert.FromBase64String(parts[1]);
        var expectedHash = Convert.FromBase64String(parts[2]);
        var actualHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expectedHash.Length);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}

static class JwtTokenFactory
{
    public static string Create(AppUser user, string issuer, string audience, SecurityKey key)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email)
            ]),
            Expires = DateTime.UtcNow.AddHours(12),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}

static class ClaimsPrincipalExtensions
{
    public static int? GetUserId(this ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(raw, out var userId) ? userId : null;
    }
}

static class SocialReturnUrlResolver
{
    public static string Resolve(string? rawReturnUrl, string defaultReturnUrl)
    {
        if (string.IsNullOrWhiteSpace(rawReturnUrl))
        {
            return defaultReturnUrl;
        }

        if (!Uri.TryCreate(rawReturnUrl, UriKind.Absolute, out var returnUri) ||
            !Uri.TryCreate(defaultReturnUrl, UriKind.Absolute, out var allowedBaseUri))
        {
            return defaultReturnUrl;
        }

        var isHttps = string.Equals(returnUri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);
        var isLocalhost = string.Equals(returnUri.Host, "localhost", StringComparison.OrdinalIgnoreCase);
        if (!isHttps && !isLocalhost)
        {
            return defaultReturnUrl;
        }

        var allowedHostMatches = string.Equals(returnUri.Host, allowedBaseUri.Host, StringComparison.OrdinalIgnoreCase);
        var localhostMatches = isLocalhost;
        if (!allowedHostMatches && !localhostMatches)
        {
            return defaultReturnUrl;
        }

        return rawReturnUrl;
    }

    public static string GetDefaultDisplayName(string email)
    {
        if (!email.Contains('@', StringComparison.Ordinal))
        {
            return "User";
        }

        var candidate = email.Split('@', 2, StringSplitOptions.TrimEntries)[0];
        return string.IsNullOrWhiteSpace(candidate) ? "User" : candidate;
    }
}

static class MfaSecurity
{
    public static string GenerateAuthenticatorSecret()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(20));
    }

    public static IReadOnlyList<string> GenerateRecoveryCodes(int count = 8)
    {
        var codes = new List<string>(count);
        for (var i = 0; i < count; i++)
        {
            var bytes = RandomNumberGenerator.GetBytes(5);
            codes.Add(Convert.ToHexString(bytes));
        }

        return codes;
    }

    public static string SerializeRecoveryCodes(IReadOnlyCollection<string> codes) =>
        JsonSerializer.Serialize(codes.Select(HashRecoveryCode).ToArray());

    public static bool TryUseRecoveryCode(AppUser user, string candidateCode)
    {
        if (string.IsNullOrWhiteSpace(candidateCode) || string.IsNullOrWhiteSpace(user.MfaRecoveryCodesJson))
        {
            return false;
        }

        var storedHashes = JsonSerializer.Deserialize<List<string>>(user.MfaRecoveryCodesJson);
        if (storedHashes is null || storedHashes.Count == 0)
        {
            return false;
        }

        var codeHash = HashRecoveryCode(candidateCode);
        var index = storedHashes.FindIndex(value => string.Equals(value, codeHash, StringComparison.Ordinal));
        if (index < 0)
        {
            return false;
        }

        storedHashes.RemoveAt(index);
        user.MfaRecoveryCodesJson = JsonSerializer.Serialize(storedHashes);
        return true;
    }

    public static bool VerifyAuthenticatorCode(string? secret, string? code, DateTime? nowUtc = null)
    {
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        var normalizedCode = new string(code.Where(char.IsDigit).ToArray());
        if (normalizedCode.Length != 6)
        {
            return false;
        }

        byte[] key;
        try
        {
            key = Convert.FromBase64String(secret);
        }
        catch (FormatException)
        {
            return false;
        }
        var timestamp = (nowUtc ?? DateTime.UtcNow).ToUniversalTime();
        var unixWindow = new DateTimeOffset(timestamp).ToUnixTimeSeconds() / 30;

        for (var offset = -1L; offset <= 1L; offset++)
        {
            var candidate = ComputeTotp(key, unixWindow + offset);
            if (string.Equals(candidate, normalizedCode, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    public static string HashChallengeToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }

    private static string HashRecoveryCode(string code)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToBase64String(hash);
    }

    private static string ComputeTotp(byte[] key, long timestepNumber)
    {
        Span<byte> timestepBytes = stackalloc byte[8];
        for (var i = 7; i >= 0; i--)
        {
            timestepBytes[i] = (byte)(timestepNumber & 0xFF);
            timestepNumber >>= 8;
        }

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(timestepBytes.ToArray());
        var offset = hash[^1] & 0x0F;
        var binary =
            ((hash[offset] & 0x7f) << 24) |
            (hash[offset + 1] << 16) |
            (hash[offset + 2] << 8) |
            hash[offset + 3];
        var otp = binary % 1_000_000;
        return otp.ToString("D6");
    }
}
