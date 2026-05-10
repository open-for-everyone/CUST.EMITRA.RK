using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
