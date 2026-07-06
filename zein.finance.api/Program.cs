
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.JSInterop.Implementation;

var builder = WebApplication.CreateBuilder(args);

IdentityModelEventSource.ShowPII = true;
IdentityModelEventSource.LogCompleteSecurityArtifact = true; // Enable detailed error messages for authentication/authorization issues (useful for debugging, but disable in production)

builder.Services.AddOpenApi();
builder.Services.AddCors();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<TokenService>();
var databaseProvider = builder.Configuration.GetValue<string>("DatabaseProvider")?.Trim();
var sqliteConnection = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=financehub.db";
var sqlServerConnection = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<FinanceDbContext>(options =>
{
    var provider = databaseProvider?.ToLowerInvariant();
    if (builder.Environment.IsDevelopment() && string.IsNullOrEmpty(provider))
    {
        provider = "inmemory";
    }

    switch (provider)
    {
        case "sqlserver":
            options.UseSqlServer(sqlServerConnection);
            break;
        case "sqlite":
            options.UseSqlite(sqliteConnection);
            break;
        case "inmemory":
            options.UseInMemoryDatabase("FinanceDb");
            break;
        default:
            options.UseSqlite(sqliteConnection);
            break;
    }
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

JsonWebTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenHandlers.Clear();
        // This handler is more tolerant of slight encoding variations.
        options.TokenHandlers.Add(new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler()); 
        
        // Tell the middleware NOT to look for an external discovery document
        options.Authority = null; 
        options.MetadataAddress = string.Empty;
        options.RequireHttpsMetadata = false; 

        var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer, // Must match the 'iss' claim in jwt.io
            
            ValidateAudience = true,
            ValidAudience = jwt.Audience, // Must match the 'aud' claim in jwt.io
            
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),

            LogValidationExceptions = false, 
            ValidTypes = new[] { "JWT" },
            
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero // Removes the 5-minute default buffer
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("MembersRead", policy => policy.RequireRole($"{UserRole.Member}", $"{UserRole.Admin}"));
    options.AddPolicy("MembersWrite", policy => policy.RequireRole($"{UserRole.Admin}"));
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseRouting();
app.UseHttpsRedirection();
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
app.UseAuthentication();
app.UseAuthorization();

MinimalApi.Configure(app);

app.Run();