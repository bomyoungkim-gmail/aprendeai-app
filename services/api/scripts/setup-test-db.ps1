#!/usr/bin/env pwsh
# Setup test database for integration tests

Write-Host "🔧 Setting up test database..." -ForegroundColor Cyan

# Set environment to test
$env:NODE_ENV = "test"
$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/aprendeai_test"

Write-Host "📦 Database: $env:DATABASE_URL" -ForegroundColor Yellow

# Drop and recreate test database
Write-Host "🗑️  Dropping existing test database..." -ForegroundColor Yellow
psql -U postgres -c "DROP DATABASE IF EXISTS aprendeai_test;" 2>$null

Write-Host "✨ Creating fresh test database..." -ForegroundColor Yellow
psql -U postgres -c "CREATE DATABASE aprendeai_test;"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database. Make sure PostgreSQL is running." -ForegroundColor Red
    exit 1
}

# Run migrations
Write-Host "🚀 Running Prisma migrations..." -ForegroundColor Yellow
cd ..
npx prisma migrate deploy --schema=./db/schema.prisma

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migrations failed" -ForegroundColor Red
    exit 1
}

# Run seed
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npx ts-node db/seed.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Seeding failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Test database setup complete!" -ForegroundColor Green
Write-Host "You can now run: npm run test:integration" -ForegroundColor Cyan
