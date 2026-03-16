#!/bin/bash
set -e

echo "============================================"
echo "Church Register - Starting Application"
echo "============================================"
echo ""
echo "Migrations will be applied automatically on startup"
echo "Please wait..."
echo ""
echo "============================================"
echo "Starting API Service..."
echo "Access the application at: http://localhost:5000"
echo "============================================"

# Start the application (migrations will run automatically in Program.cs)
exec dotnet ChurchRegister.ApiService.dll
