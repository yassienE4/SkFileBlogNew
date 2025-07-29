# Use the official .NET SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build

# Set the working directory
WORKDIR /app

# Copy the project file and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy the rest of the source code
COPY . ./

# Build the application
RUN dotnet publish -c Release -o out

# Use the runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime

# Set the working directory
WORKDIR /app

# Copy the published application from the build stage
COPY --from=build /app/out .

# Copy content directory with proper permissions
COPY --from=build /app/content ./content

# Ensure content directory exists and set proper permissions
RUN mkdir -p /app/content/posts /app/content/users /app/content/categories /app/content/tags /app/content/media && \
    chmod -R 755 /app/content

# Expose the port that the app runs on
EXPOSE 8080

# Set environment variables for production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

# Run the application
ENTRYPOINT ["dotnet", "SkFileBlogSystem.dll"]
