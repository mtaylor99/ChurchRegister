# Stage 1: Build React Frontend
FROM node:20-alpine AS react-build
WORKDIR /app/react

# Copy package files
COPY ChurchRegister.React/package*.json ./
RUN npm ci

# Copy React source and Docker-specific environment file
COPY ChurchRegister.React/ ./
COPY ChurchRegister.React/.env.docker ./.env.production

# Build with Docker environment (uses .env.production during build)
RUN npm run build

# Stage 2: Build .NET API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dotnet-build
WORKDIR /src

# Copy solution and project files
COPY ChurchRegister.sln ./
COPY ChurchRegister.ApiService/ChurchRegister.ApiService.csproj ./ChurchRegister.ApiService/
COPY ChurchRegister.Database/ChurchRegister.Database.csproj ./ChurchRegister.Database/
COPY ChurchRegister.AppHost/ChurchRegister.AppHost.csproj ./ChurchRegister.AppHost/

# Restore dependencies
RUN dotnet restore ChurchRegister.ApiService/ChurchRegister.ApiService.csproj

# Copy entire source code
COPY ChurchRegister.ApiService/ ./ChurchRegister.ApiService/
COPY ChurchRegister.Database/ ./ChurchRegister.Database/
COPY ChurchRegister.AppHost/ ./ChurchRegister.AppHost/

# Build and publish the API (remove --no-restore to avoid Windows path issues)
WORKDIR /src/ChurchRegister.ApiService
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Copy published API
COPY --from=dotnet-build /app/publish .

# Copy React build to wwwroot
COPY --from=react-build /app/react/dist ./wwwroot

# Copy startup script and fix line endings
COPY docker/docker-entrypoint.sh /app/docker-entrypoint.sh
# Install dos2unix to convert line endings, then remove it to keep image small
RUN apt-get update && apt-get install -y dos2unix && \
    dos2unix /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh && \
    apt-get remove -y dos2unix && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 5000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
