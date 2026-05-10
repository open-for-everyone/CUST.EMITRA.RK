using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

const string ExternalCookieScheme = "ExternalCookie";
const string GoogleSocialProvider = "google";
const string FacebookSocialProvider = "facebook";
const string LinkedInSocialProvider = "linkedin";
const string CorrelationIdHeader = "X-Correlation-ID";
const string UpdatesCacheKey = "api:updates:v1";

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
builder.Services.AddMemoryCache();

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

var frontendBaseUrl = builder.Configuration["Frontend:BaseUrl"]?.Trim() ?? "http://localhost:4200";
var defaultSocialReturnUrl = $"{frontendBaseUrl.TrimEnd('/')}/auth/callback";

var jwtSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

var socialProviders = new List<SocialProviderConfig>();

var authBuilder = builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
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
    })
    .AddCookie(ExternalCookieScheme, options =>
    {
        options.Cookie.Name = "emitra.external.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromMinutes(10);
    });

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    authBuilder.AddGoogle(GoogleSocialProvider, options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.SignInScheme = ExternalCookieScheme;
        options.CallbackPath = "/signin-google";
    });

    socialProviders.Add(new SocialProviderConfig(GoogleSocialProvider, "Google", GoogleSocialProvider));
}

var facebookAppId = builder.Configuration["Authentication:Facebook:AppId"];
var facebookAppSecret = builder.Configuration["Authentication:Facebook:AppSecret"];
if (!string.IsNullOrWhiteSpace(facebookAppId) && !string.IsNullOrWhiteSpace(facebookAppSecret))
{
    authBuilder.AddFacebook(FacebookSocialProvider, options =>
    {
        options.AppId = facebookAppId;
        options.AppSecret = facebookAppSecret;
        options.SignInScheme = ExternalCookieScheme;
        options.CallbackPath = "/signin-facebook";
        options.Fields.Add("name");
        options.Fields.Add("email");
        options.Scope.Add("email");
    });

    socialProviders.Add(new SocialProviderConfig(FacebookSocialProvider, "Facebook", FacebookSocialProvider));
}

var linkedInClientId = builder.Configuration["Authentication:LinkedIn:ClientId"];
var linkedInClientSecret = builder.Configuration["Authentication:LinkedIn:ClientSecret"];
if (!string.IsNullOrWhiteSpace(linkedInClientId) && !string.IsNullOrWhiteSpace(linkedInClientSecret))
{
    authBuilder.AddOAuth(LinkedInSocialProvider, options =>
    {
        options.ClientId = linkedInClientId;
        options.ClientSecret = linkedInClientSecret;
        options.CallbackPath = "/signin-linkedin";
        options.SignInScheme = ExternalCookieScheme;
        options.AuthorizationEndpoint = "https://www.linkedin.com/oauth/v2/authorization";
        options.TokenEndpoint = "https://www.linkedin.com/oauth/v2/accessToken";
        options.UserInformationEndpoint = "https://api.linkedin.com/v2/userinfo";
        options.SaveTokens = true;

        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");

        options.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "sub");
        options.ClaimActions.MapJsonKey(ClaimTypes.Name, "name");
        options.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");

        options.Events = new OAuthEvents
        {
            OnCreatingTicket = async context =>
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, context.Options.UserInformationEndpoint);
                request.Headers.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", context.AccessToken);

                using var response = await context.Backchannel.SendAsync(request, context.HttpContext.RequestAborted);
                response.EnsureSuccessStatusCode();

                var userJson = await response.Content.ReadAsStringAsync(context.HttpContext.RequestAborted);
                using var userData = JsonDocument.Parse(userJson);

                context.RunClaimActions(userData.RootElement);
            }
        };
    });

    socialProviders.Add(new SocialProviderConfig(LinkedInSocialProvider, "LinkedIn", LinkedInSocialProvider));
}

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
app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers[CorrelationIdHeader].FirstOrDefault();
    if (string.IsNullOrWhiteSpace(correlationId))
    {
        correlationId = Guid.NewGuid().ToString("N");
    }

    context.Response.Headers[CorrelationIdHeader] = correlationId;

    using (app.Logger.BeginScope(new Dictionary<string, object?>
    {
        ["CorrelationId"] = correlationId
    }))
    {
        await next();
    }
});
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

var socialSchemeLookup = socialProviders
    .ToDictionary(item => item.Key, item => item.Scheme, StringComparer.OrdinalIgnoreCase);

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", platform = ".NET 10", auth = "jwt-social", chatbot = "google-ai-ready" }))
   .WithName("Health");

app.MapGet("/api/updates", (IMemoryCache cache) =>
{
    var payload = cache.GetOrCreate(UpdatesCacheKey, entry =>
    {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);
        entry.SlidingExpiration = TimeSpan.FromMinutes(1);
        return updates;
    });

    return Results.Ok(payload);
})
   .WithName("GetUpdates");

app.MapGet("/api/auth/social/providers", () =>
{
    var providers = socialProviders
        .Select(item => new SocialProviderResponse(item.Key, item.DisplayName))
        .ToArray();

    return Results.Ok(providers);
});

app.MapGet("/api/auth/social/{provider}/start", (string provider, string? returnUrl, HttpContext httpContext) =>
{
    if (!socialSchemeLookup.TryGetValue(provider, out var scheme))
    {
        return Results.NotFound(new { message = "Social provider is not configured." });
    }

    var safeReturnUrl = SocialReturnUrlResolver.Resolve(returnUrl, defaultSocialReturnUrl);
    var callbackPath = $"/api/auth/social/{provider}/callback";
    var redirectUri = QueryHelpers.AddQueryString(callbackPath, "returnUrl", safeReturnUrl);

    var props = new AuthenticationProperties
    {
        RedirectUri = redirectUri
    };

    return Results.Challenge(props, [scheme]);
});

app.MapGet("/api/auth/social/{provider}/callback", async (
    string provider,
    string? returnUrl,
    HttpContext httpContext,
    AppDbContext db,
    BackendTeamNotifier notifier,
    CancellationToken cancellationToken) =>
{
    if (!socialSchemeLookup.ContainsKey(provider))
    {
        return Results.NotFound(new { message = "Social provider is not configured." });
    }

    var safeReturnUrl = SocialReturnUrlResolver.Resolve(returnUrl, defaultSocialReturnUrl);
    var authResult = await httpContext.AuthenticateAsync(ExternalCookieScheme);

    if (!authResult.Succeeded || authResult.Principal is null)
    {
        return Results.Redirect(QueryHelpers.AddQueryString(safeReturnUrl, "error", "social_auth_failed"));
    }

    var principal = authResult.Principal;
    var email = principal.FindFirstValue(ClaimTypes.Email)?.Trim().ToLowerInvariant();
    var name = principal.FindFirstValue(ClaimTypes.Name)?.Trim();

    if (string.IsNullOrWhiteSpace(email))
    {
        await httpContext.SignOutAsync(ExternalCookieScheme);
        return Results.Redirect(QueryHelpers.AddQueryString(safeReturnUrl, "error", "email_not_provided_by_provider"));
    }

    name = string.IsNullOrWhiteSpace(name)
        ? SocialReturnUrlResolver.GetDefaultDisplayName(email)
        : name;

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    if (user is null)
    {
        user = new AppUser
        {
            Name = name,
            Email = email,
            PasswordHash = PasswordHasher.Hash(Guid.NewGuid().ToString("N"))
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        db.ActivityLogs.Add(new ActivityLog
        {
            UserId = user.Id,
            Action = "social-signup",
            Metadata = $"Created account with {provider}"
        });

        await db.SaveChangesAsync(cancellationToken);
        await notifier.NotifyAsync("social-signup", user.Id, $"User signed up with {provider}", cancellationToken);
    }
    else
    {
        if (!string.Equals(user.Name, name, StringComparison.Ordinal))
        {
            user.Name = name;
        }

        db.ActivityLogs.Add(new ActivityLog
        {
            UserId = user.Id,
            Action = "social-login",
            Metadata = $"Logged in with {provider}"
        });

        await db.SaveChangesAsync(cancellationToken);
        await notifier.NotifyAsync("social-login", user.Id, $"User logged in with {provider}", cancellationToken);
    }

    var token = JwtTokenFactory.Create(user, jwtIssuer, jwtAudience, jwtSigningKey);

    await httpContext.SignOutAsync(ExternalCookieScheme);
    var redirect = QueryHelpers.AddQueryString(safeReturnUrl, "token", token);
    return Results.Redirect(redirect);
});

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
        return ApiResponses.Validation("Name, email, and password are required.");
    }

    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    if (!new EmailAddressAttribute().IsValid(normalizedEmail))
    {
        return ApiResponses.Validation("Please provide a valid email address.");
    }

    if (request.Password.Length < 6)
    {
        return ApiResponses.Validation("Password must be at least 6 characters long.");
    }

    var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
    if (existing is not null)
    {
        return ApiResponses.Conflict("Email is already registered.");
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
        return ApiResponses.Unauthorized("Authentication is required.");
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
        return ApiResponses.Unauthorized("User profile not found.");
    }

    var user = await db.Users.FindAsync([userId.Value], cancellationToken);
    return user is null
        ? ApiResponses.Unauthorized("User profile not found.")
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
        return ApiResponses.Validation("Message is required.");
    }

    var userId = principal.GetUserId();
    if (userId is null)
    {
        return ApiResponses.Unauthorized("Authentication is required to chat.");
    }

    var user = await db.Users.FindAsync([userId.Value], cancellationToken);
    if (user is null)
    {
        return ApiResponses.Unauthorized("User profile not found.");
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
    int page = 1,
    int pageSize = 20,
    CancellationToken cancellationToken) =>
{
    var userId = principal.GetUserId();
    if (userId is null)
    {
        return ApiResponses.Unauthorized("Authentication is required to access chat history.");
    }

    var normalizedPage = page <= 0 ? 1 : page;
    var normalizedPageSize = pageSize switch
    {
        <= 0 => 20,
        > 50 => 50,
        _ => pageSize
    };

    var totalCount = await db.ChatMessages
        .Where(chat => chat.UserId == userId)
        .CountAsync(cancellationToken);

    var totalPages = totalCount == 0
        ? 0
        : (int)Math.Ceiling(totalCount / (double)normalizedPageSize);

    if (totalPages > 0 && normalizedPage > totalPages)
    {
        normalizedPage = totalPages;
    }

    var history = await db.ChatMessages
        .Where(chat => chat.UserId == userId)
        .OrderByDescending(chat => chat.CreatedAtUtc)
        .Skip((normalizedPage - 1) * normalizedPageSize)
        .Take(normalizedPageSize)
        .Select(chat => new ChatHistoryItem(chat.UserMessage, chat.BotResponse, chat.CreatedAtUtc))
        .ToListAsync(cancellationToken);

    return Results.Ok(new PagedResponse<ChatHistoryItem>(
        history,
        normalizedPage,
        normalizedPageSize,
        totalCount,
        totalPages));
});

app.MapGet("/api/activity", [Authorize] async (
    ClaimsPrincipal principal,
    AppDbContext db,
    int page = 1,
    int pageSize = 30,
    CancellationToken cancellationToken) =>
{
    var userId = principal.GetUserId();
    if (userId is null)
    {
        return ApiResponses.Unauthorized("Authentication is required to access activity.");
    }

    var normalizedPage = page <= 0 ? 1 : page;
    var normalizedPageSize = pageSize switch
    {
        <= 0 => 30,
        > 100 => 100,
        _ => pageSize
    };

    var totalCount = await db.ActivityLogs
        .Where(a => a.UserId == userId)
        .CountAsync(cancellationToken);

    var totalPages = totalCount == 0
        ? 0
        : (int)Math.Ceiling(totalCount / (double)normalizedPageSize);

    if (totalPages > 0 && normalizedPage > totalPages)
    {
        normalizedPage = totalPages;
    }

    var activities = await db.ActivityLogs
        .Where(a => a.UserId == userId)
        .OrderByDescending(a => a.CreatedAtUtc)
        .Skip((normalizedPage - 1) * normalizedPageSize)
        .Take(normalizedPageSize)
        .Select(a => new ActivityItem(a.Action, a.Metadata, a.CreatedAtUtc))
        .ToListAsync(cancellationToken);

    return Results.Ok(new PagedResponse<ActivityItem>(
        activities,
        normalizedPage,
        normalizedPageSize,
        totalCount,
        totalPages));
});

app.Run();
