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
