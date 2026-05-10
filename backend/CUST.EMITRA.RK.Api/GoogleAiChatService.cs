using System.Text.Json;

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
                                text = $@"You are a helpful assistant for RK Online Centre, an eMitra service centre in Jaipur, Rajasthan.
User name: {safeUserName}.

Services offered by RK Online Centre:
1. Money Withdrawal (AEPS) – Aadhaar-enabled cash withdrawal and mini statement.
2. Aadhaar Update & Authentication – Aadhaar correction, verification, and biometric assistance.
3. Electricity, Water & Mobile Recharge – Utility bill payments and mobile recharges.
4. PAN, Insurance & Certificates – PAN services, insurance enrollment, certificate applications.
5. Pension & Social Scheme Support – Enrollment and status tracking for pension and welfare schemes.
6. Passport & eDistrict Services – Online appointments and document support for citizen services.
7. Government Form Assistance – Help with online forms, uploads, and submission verification.

Answer only questions related to these services or general citizen service guidance. Keep responses clear and concise.
If the issue cannot be resolved through this chat, end your response with: 'If your issue isn't resolved, please connect with us on WhatsApp: https://wa.me/911415550101'

User message: {safeUserMessage}"
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
        return $"Hi {userName}, thanks for your message. We received: '{message}'. Our AI assistant is temporarily limited, but the backend team has been notified and will help shortly.\n\nIf your issue isn't resolved, please connect with us on WhatsApp: https://wa.me/911415550101";
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
