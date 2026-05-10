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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

var updates = new[]
{
    "AEPS cash withdrawal window extended to 8:00 PM.",
    "Aadhaar demographic correction requests now available daily.",
    "New POP pension enrollment guidance desk active this week.",
    "Digital receipt download enabled for all utility transactions."
};

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", platform = ".NET 10" }))
   .WithName("Health");

app.MapGet("/api/updates", () => Results.Ok(updates))
   .WithName("GetUpdates");

app.Run();
