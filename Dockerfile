# Stage 1: Build .NET 8 Web API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj files and restore dependencies
COPY src/OsonSavdo.Domain/OsonSavdo.Domain.csproj src/OsonSavdo.Domain/
COPY src/OsonSavdo.Application/OsonSavdo.Application.csproj src/OsonSavdo.Application/
COPY src/OsonSavdo.Infrastructure/OsonSavdo.Infrastructure.csproj src/OsonSavdo.Infrastructure/
COPY src/OsonSavdo.Api/OsonSavdo.Api.csproj src/OsonSavdo.Api/

RUN dotnet restore src/OsonSavdo.Api/OsonSavdo.Api.csproj

# Copy all source code and publish
COPY src/ src/
RUN dotnet publish src/OsonSavdo.Api/OsonSavdo.Api.csproj -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Render exposes PORT env variable (defaults to 10000 or 8080)
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "OsonSavdo.Api.dll"]
