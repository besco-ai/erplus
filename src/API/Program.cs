using System.Reflection;
using System.Text;
using ERPlus.API.Middleware;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ──
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "ERPlus")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/erplus-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30));

// ── JWT Authentication ──
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ERPlus-Dev-SecretKey-MinimoTrintaDoisChars!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ERPlus",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ERPlus",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// ── CORS ──
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowClient", policy =>
    {
        var origins = builder.Configuration.GetSection("Client:Urls").Get<string[]>()
            ?? new[] { builder.Configuration["Client:Url"] ?? "http://localhost:5173" };

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ── Health Checks ──
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgresql",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "db", "ready" });

// ── Swagger ──
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ERPlus API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "JWT Authorization header. Exemplo: Bearer {token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// ── Discover & register all modules ──
var modules = DiscoverModules();
foreach (var module in modules)
{
    Log.Information("Registrando módulo: {Module}", module.ModuleName);
    module.AddServices(builder.Services, builder.Configuration);
}

var app = builder.Build();

// ── Pipeline (order matters!) ──
app.UseGlobalExceptionHandler();
app.UseSerilogRequestLogging();
app.UseRateLimiting();
app.UseCors("AllowClient");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

// ── Module pipelines ──
foreach (var module in modules)
{
    module.UsePipeline(app);
}

// ── Health checks ──
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            duration = report.TotalDuration.TotalMilliseconds + "ms",
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds + "ms",
                error = e.Value.Exception?.Message
            })
        };
        await context.Response.WriteAsJsonAsync(result);
    }
}).WithTags("Health");

app.MapGet("/health/live", () => Results.Ok(new { status = "alive" })).WithTags("Health");

// ── Map module endpoints ──
foreach (var module in modules)
{
    module.MapEndpoints(app);
}

Log.Information("ERPlus API iniciada com {Count} módulos", modules.Count);
app.Run();

// ── Module discovery via reflection ──
static List<IModuleInstaller> DiscoverModules()
{
    var moduleType = typeof(IModuleInstaller);
    var assemblies = Directory.GetFiles(AppContext.BaseDirectory, "ERPlus.Modules.*.dll")
        .Select(Assembly.LoadFrom)
        .ToList();

    return assemblies
        .SelectMany(a => a.GetTypes())
        .Where(t => moduleType.IsAssignableFrom(t) && t is { IsInterface: false, IsAbstract: false })
        .Select(t => (IModuleInstaller)Activator.CreateInstance(t)!)
        .OrderBy(m => m.ModuleName)
        .ToList();
}
