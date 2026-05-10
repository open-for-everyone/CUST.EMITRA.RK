using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=emitra.db";
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CUST.EMITRA.RK.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CUST.EMITRA.RK.Client";
var jwtKey = builder.Configuration["Jwt:Key"] ?? "CHANGE_THIS_KEY_IN_ENVIRONMENT_VARIABLE";
if (!builder.Environment.IsDevelopment() &&
    (jwtKey == "CHANGE_THIS_KEY_IN_ENVIRONMENT_VARIABLE" || jwtKey.Length < 32))
{
    throw new InvalidOperationException("Set Jwt__Key environment variable with a strong secret (minimum 32 characters).");
}

var jwtSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = jwtSigningKey,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<GoogleAiChatService>();
builder.Services.AddScoped<BackendTeamNotifier>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();

var updates = new[]
{
    "AEPS cash withdrawal window extended to 8:00 PM.",
    "Aadhaar demographic correction requests now available daily.",
    "New POP pension enrollment guidance desk active this week.",
    "Digital receipt download enabled for all utility transactions.",
    "Secure user accounts and chatbot support are now available."
};

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", platform = ".NET 10", auth = "jwt", chatbot = "google-ai-ready" }))
   .WithName("Health");

app.MapGet("/api/updates", () => Results.Ok(updates))
   .WithName("GetUpdates");

app.MapPost("/api/auth/signup", async (
    SignupRequest request,
    AppDbContext db,
    BackendTeamNotifier notifier,
    ILoggerFactory loggerFactory,
    CancellationToken cancellationToken) =>
{
    var logger = loggerFactory.CreateLogger("Auth");

    if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { message = "Name, email, and password are required." });
    }

    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    if (!new EmailAddressAttribute().IsValid(normalizedEmail))
    {
        return Results.BadRequest(new { message = "Please provide a valid email address." });
    }

    if (request.Password.Length < 6)
    {
        return Results.BadRequest(new { message = "Password must be at least 6 characters long." });
    }

    var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
    if (existing is not null)
    {
        return Results.Conflict(new { message = "Email is already registered." });
    }

    var user = new AppUser
    {
        Name = request.Name.Trim(),
        Email = normalizedEmail,
        PasswordHash = PasswordHasher.Hash(request.Password)
    };

    db.Users.Add(user);
    await db.SaveChangesAsync(cancellationToken);

    db.ActivityLogs.Add(new ActivityLog
    {
        UserId = user.Id,
        Action = "signup",
        Metadata = "User created account"
    });

    await db.SaveChangesAsync(cancellationToken);
    await notifier.NotifyAsync("signup", user.Id, "User signed up", cancellationToken);
    logger.LogInformation("New user signup completed for user ID {UserId}", user.Id);

    var token = JwtTokenFactory.Create(user, jwtIssuer, jwtAudience, jwtSigningKey);
    return Results.Ok(new AuthResponse(token, user.Name, user.Email));
});

app.MapPost("/api/auth/login", async (
    LoginRequest request,
    HttpContext httpContext,
    AppDbContext db,
    BackendTeamNotifier notifier,
    ILoggerFactory loggerFactory,
    CancellationToken cancellationToken) =>
{
    var logger = loggerFactory.CreateLogger("Auth");

    var normalizedEmail = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

    if (user is null || !PasswordHasher.Verify(request.Password ?? string.Empty, user.PasswordHash))
    {
        logger.LogWarning("Failed login attempt from IP {IpAddress}", httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
        return Results.Unauthorized();
    }

    db.ActivityLogs.Add(new ActivityLog
    {
        UserId = user.Id,
        Action = "login",
        Metadata = "User logged in"
    });

    await db.SaveChangesAsync(cancellationToken);
    await notifier.NotifyAsync("login", user.Id, "User logged in", cancellationToken);

    var token = JwtTokenFactory.Create(user, jwtIssuer, jwtAudience, jwtSigningKey);
    return Results.Ok(new AuthResponse(token, user.Name, user.Email));
});

app.MapGet("/api/auth/me", [Authorize] async (ClaimsPrincipal principal, AppDbContext db, CancellationToken cancellationToken) =>
{
    var userId = principal.GetUserId();
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var user = await db.Users.FindAsync([userId.Value], cancellationToken);
    return user is null
        ? Results.Unauthorized()
        : Results.Ok(new UserProfileResponse(user.Name, user.Email, user.CreatedAtUtc));
});

app.MapPost("/api/chat", [Authorize] async (
    ChatRequest request,
    ClaimsPrincipal principal,
    AppDbContext db,
    GoogleAiChatService chatService,
    BackendTeamNotifier notifier,
    ILoggerFactory loggerFactory,
    CancellationToken cancellationToken) =>
{
    var logger = loggerFactory.CreateLogger("Chat");

    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.BadRequest(new { message = "Message is required." });
    }

    var userId = principal.GetUserId();
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var user = await db.Users.FindAsync([userId.Value], cancellationToken);
    if (user is null)
    {
        return Results.Unauthorized();
    }

    var responseText = await chatService.GenerateReplyAsync(request.Message.Trim(), user.Name, cancellationToken);

    db.ChatMessages.Add(new ChatMessage
    {
        UserId = user.Id,
        UserMessage = request.Message.Trim(),
        BotResponse = responseText
    });

    db.ActivityLogs.Add(new ActivityLog
    {
        UserId = user.Id,
        Action = "chat",
        Metadata = request.Message.Trim()[..Math.Min(100, request.Message.Trim().Length)]
    });

    await db.SaveChangesAsync(cancellationToken);

    logger.LogInformation("Chat message processed for user ID {UserId}", user.Id);
    await notifier.NotifyAsync("chat", user.Id, "User chatted with AI assistant", cancellationToken);

    return Results.Ok(new ChatResponse(responseText, DateTime.UtcNow));
});

app.MapGet("/api/chat/history", [Authorize] async (
    ClaimsPrincipal principal,
    AppDbContext db,
    CancellationToken cancellationToken) =>
{
    var userId = principal.GetUserId();
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var history = await db.ChatMessages
        .Where(chat => chat.UserId == userId)
        .OrderByDescending(chat => chat.CreatedAtUtc)
        .Take(20)
        .Select(chat => new ChatHistoryItem(chat.UserMessage, chat.BotResponse, chat.CreatedAtUtc))
        .ToListAsync(cancellationToken);

    return Results.Ok(history);
});

app.MapGet("/api/activity", [Authorize] async (
    ClaimsPrincipal principal,
    AppDbContext db,
    CancellationToken cancellationToken) =>
{
    var userId = principal.GetUserId();
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var activities = await db.ActivityLogs
        .Where(a => a.UserId == userId)
        .OrderByDescending(a => a.CreatedAtUtc)
        .Take(30)
        .Select(a => new ActivityItem(a.Action, a.Metadata, a.CreatedAtUtc))
        .ToListAsync(cancellationToken);

    return Results.Ok(activities);
});

app.Run();

record SignupRequest(string Name, string Email, string Password);
record LoginRequest(string Email, string Password);
record ChatRequest(string Message);
record AuthResponse(string Token, string Name, string Email);
record UserProfileResponse(string Name, string Email, DateTime CreatedAtUtc);
record ChatResponse(string Reply, DateTime CreatedAtUtc);
record ChatHistoryItem(string Message, string Reply, DateTime CreatedAtUtc);
record ActivityItem(string Action, string? Metadata, DateTime CreatedAtUtc);

class AppUser
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

class ChatMessage
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AppUser? User { get; set; }
    public string UserMessage { get; set; } = string.Empty;
    public string BotResponse { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

class ActivityLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public AppUser? User { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Metadata { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<ChatMessage>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

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

class GoogleAiChatService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<GoogleAiChatService> logger)
{
    public async Task<string> GenerateReplyAsync(string userMessage, string userName, CancellationToken cancellationToken)
    {
        // Accept either the .NET-style config name or the plain env var GEMINI_API_KEY.
        var apiKey = configuration["GoogleAi:ApiKey"]
            ?? configuration["GEMINI_API_KEY"]
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning("Google AI key missing. Returning fallback response.");
            return BuildFallbackResponse(userMessage, userName);
        }

        try
        {
            var client = httpClientFactory.CreateClient();
            var endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
            var safeUserName = SanitizeForPrompt(userName, 80);
            var safeUserMessage = SanitizeForPrompt(userMessage, 500);

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new
                            {
                                text = $"You are a helpful assistant for an eMitra service center. User name: {safeUserName}. Respond clearly and shortly. User message: {safeUserMessage}"
                            }
                        }
                    }
                }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = JsonContent.Create(payload)
            };
            request.Headers.Add("X-Goog-Api-Key", apiKey);

            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Google AI request failed with status code {StatusCode}", response.StatusCode);
                return BuildFallbackResponse(userMessage, userName);
            }

            var jsonText = await response.Content.ReadAsStringAsync(cancellationToken);
            using var json = JsonDocument.Parse(jsonText);

            if (json.RootElement.TryGetProperty("candidates", out var candidates) &&
                candidates.ValueKind == JsonValueKind.Array &&
                candidates.GetArrayLength() > 0)
            {
                var first = candidates[0];
                if (first.TryGetProperty("content", out var content) &&
                    content.TryGetProperty("parts", out var parts) &&
                    parts.ValueKind == JsonValueKind.Array &&
                    parts.GetArrayLength() > 0)
                {
                    var text = parts[0].GetProperty("text").GetString();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return text.Trim();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Google AI request failed unexpectedly");
        }

        return BuildFallbackResponse(userMessage, userName);
    }

    private static string BuildFallbackResponse(string message, string userName)
    {
        return $"Hi {userName}, thanks for your message. We received: '{message}'. Our AI assistant is temporarily limited, but the backend team has been notified and will help shortly.";
    }

    private static string SanitizeForPrompt(string input, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return "N/A";
        }

        var normalized = input.Replace("\r", " ").Replace("\n", " ").Replace("\t", " ").Trim();
        return normalized.Length > maxLength ? normalized[..maxLength] : normalized;
    }
}

class BackendTeamNotifier(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<BackendTeamNotifier> logger)
{
    public async Task NotifyAsync(string action, int userId, string details, CancellationToken cancellationToken)
    {
        logger.LogInformation("User activity detected. Action: {Action}, UserId: {UserId}", action, userId);

        var webhookUrl = configuration["BackendTeam:WebhookUrl"];
        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            return;
        }

        try
        {
            var client = httpClientFactory.CreateClient();
            var payload = new
            {
                action,
                userId,
                details,
                timestampUtc = DateTime.UtcNow
            };

            using var response = await client.PostAsJsonAsync(webhookUrl, payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Backend team webhook failed with status code {StatusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Backend team notification failed");
        }
    }
}
