using Microsoft.EntityFrameworkCore;

class AppUser
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool MfaEnabled { get; set; }
    public string? MfaAuthenticatorSecret { get; set; }
    public string? MfaRecoveryCodesJson { get; set; }
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

class PublicSetting
{
    public int Id { get; set; }
    public string Language { get; set; } = "en";
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

class MfaLoginChallenge
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AppUser? User { get; set; }
    public string ChallengeTokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<PublicSetting> PublicSettings => Set<PublicSetting>();
    public DbSet<MfaLoginChallenge> MfaLoginChallenges => Set<MfaLoginChallenge>();

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

        modelBuilder.Entity<ChatMessage>()
            .HasIndex(c => new { c.UserId, c.CreatedAtUtc });

        modelBuilder.Entity<ActivityLog>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ActivityLog>()
            .HasIndex(c => new { c.UserId, c.CreatedAtUtc });

        modelBuilder.Entity<PublicSetting>()
            .HasIndex(s => new { s.Language, s.Key })
            .IsUnique();

        modelBuilder.Entity<MfaLoginChallenge>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MfaLoginChallenge>()
            .HasIndex(c => c.ExpiresAtUtc);
    }
}
