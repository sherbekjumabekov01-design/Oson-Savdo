using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OsonSavdo.Api.Middlewares;
using OsonSavdo.Application;
using OsonSavdo.Application.Services;
using OsonSavdo.Infrastructure;
using OsonSavdo.Infrastructure.Data;

// PostgreSQL / Supabase DateTime moslashuvi (UTC / Local timestamp xatoliklarini oldini olish)
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();

// 1. Controllerlarni va Enum konvertatsiyasini sozlash
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// 2. JWT Autentifikatsiya sozlamalari
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(AuthService.DefaultSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = AuthService.Issuer,
        ValidateAudience = true,
        ValidAudience = AuthService.Audience,
        ClockSkew = TimeSpan.Zero
    };
});

// 3. Swagger / OpenAPI sozlamalari (Bearer Token qo'llab-quvvatlashi bilan)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Oson Savdo POS & Ombor API",
        Version = "v1",
        Description = "Do'konlar uchun POS, Ombor qoldig'i, Qarz daftari, Smenalar va Tushum/Xarajatlar boshqaruv tizimi API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Tokenni kiriting (masalan: Bearer {token})"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 4. CORS siyosatini ulash
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 5. Infrastructure va Application qatlamlarini ulash
builder.Services.AddScoped<OsonSavdo.Application.Interfaces.ICurrentStoreContext, OsonSavdo.Api.Services.CurrentStoreContext>();
builder.Services.AddHostedService<OsonSavdo.Api.Services.SubscriptionCheckBackgroundService>();
builder.Services.AddHostedService<OsonSavdo.Api.Services.NightlyBackupBackgroundService>();
builder.Services.AddHostedService<OsonSavdo.Api.Services.TelegramBotPollingService>();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApplicationServices();

var app = builder.Build();

// 6. Global Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 7. Swagger interfeysi
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Oson Savdo API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Do'konlar obunasini avtomatik tekshirish (SIM-karta kabi avto-blok)
app.UseMiddleware<StoreSubscriptionMiddleware>();

app.MapControllers();

// 8. Boshlang'ich bazani yaratish va to'ldirish
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        await DbInitializer.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ma'lumotlar bazasini initsializatsiya qilishda xatolik yuz berdi.");
    }
}

app.Run();
