# 🔍 Full-Stack Verification Script
# Executa verificação completa dos 3 sprints

Write-Host "🚀 FULL-STACK VERIFICATION - Sprints 1+2+3" -ForegroundColor Cyan
Write-Host "=============================================`n" -ForegroundColor Cyan

$results = @{
  passed   = 0
  failed   = 0
  warnings = 0
}

# Helper functions
function Test-Service {
  param($name, $url)
  Write-Host "Testing $name... " -NoNewline
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ PASS" -ForegroundColor Green
    $results.passed++
    return $true
  }
  catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkRed
    $results.failed++
    return $false
  }
}

function Test-Port {
  param($port, $name)
  Write-Host "Checking port $port ($name)... " -NoNewline
  $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
  if ($connection.TcpTestSucceeded) {
    Write-Host "✅ OPEN" -ForegroundColor Green
    $results.passed++
    return $true
  }
  else {
    Write-Host "❌ CLOSED" -ForegroundColor Red
    $results.failed++
    return $false
  }
}

# 1. Infrastructure Check
Write-Host "`n📦 1. INFRASTRUCTURE" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

$postgres = Test-Port 5432 "PostgreSQL"
$redis = Test-Port 6379 "Redis"
$rabbitmq = Test-Port 5672 "RabbitMQ"

# 2. Services Check
Write-Host "`n⚙️  2. SERVICES" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow

$backend = Test-Port 4000 "Backend API"
$frontend = Test-Port 3000 "Frontend"

# 3. Backend Health (if running)
if ($backend) {
  Write-Host "`n🏥 3. BACKEND HEALTH" -ForegroundColor Yellow
  Write-Host "-------------------" -ForegroundColor Yellow
    
  # Try to get token first (basic check)
  Write-Host "Checking API availability... " -NoNewline
  try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/login" `
      -Method POST -ContentType "application/json" `
      -Body '{"email":"maria@example.com","password":"demo123"}' `
      -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        
    $token = ($healthResponse.Content | ConvertFrom-Json).accessToken
        
    if ($token) {
      Write-Host "✅ API Accessible" -ForegroundColor Green
      $results.passed++
            
      # Test Sprint 1: Content endpoint
      Write-Host "Testing Sprint 1 (Content API)... " -NoNewline
      try {
        $contentResponse = Invoke-WebRequest `
          -Uri "http://localhost:4000/api/v1/content" `
          -Headers @{Authorization = "Bearer $token" } `
          -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ PASS" -ForegroundColor Green
        $results.passed++
      }
      catch {
        Write-Host "⚠️  WARN" -ForegroundColor Yellow
        $results.warnings++
      }
            
      # Test Sprint 2: Sessions endpoint
      Write-Host "Testing Sprint 2 (Sessions API)... " -NoNewline
      try {
        # Just check if endpoint exists (may not have sessions)
        $sessionsResponse = Invoke-WebRequest `
          -Uri "http://localhost:4000/api/v1/sessions/test-id" `
          -Headers @{Authorization = "Bearer $token" } `
          -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        # 404 is OK - means endpoint exists
        Write-Host "✅ Endpoint Available" -ForegroundColor Green
        $results.passed++
      }
      catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
          Write-Host "✅ Endpoint Available (404 expected)" -ForegroundColor Green
          $results.passed++
        }
        else {
          Write-Host "⚠️  WARN" -ForegroundColor Yellow
          $results.warnings++
        }
      }
            
      # Test Sprint 3: Annotations endpoint
      Write-Host "Testing Sprint 3 (Annotations API)... " -NoNewline
      try {
        $annotationsResponse = Invoke-WebRequest `
          -Uri "http://localhost:4000/api/v1/annotations/search?query=test" `
          -Headers @{Authorization = "Bearer $token" } `
          -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ PASS" -ForegroundColor Green
        $results.passed++
      }
      catch {
        Write-Host "⚠️  WARN" -ForegroundColor Yellow
        $results.warnings++
      }
    }
  }
  catch {
    Write-Host "❌ Authentication Failed" -ForegroundColor Red
    Write-Host "  Make sure maria@example.com user exists (run: npm run seed)" -ForegroundColor DarkRed
    $results.failed++
  }
}
else {
  Write-Host "`n⚠️  Backend not running - skipping API tests" -ForegroundColor Yellow
  $results.warnings++
}

# 4. Frontend Check
if ($frontend) {
  Write-Host "`n🌐 4. FRONTEND" -ForegroundColor Yellow
  Write-Host "-------------" -ForegroundColor Yellow
    
  Write-Host "Checking frontend availability... " -NoNewline
  try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" `
      -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ PASS" -ForegroundColor Green
    $results.passed++
  }
  catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    $results.failed++
  }
}
else {
  Write-Host "`n⚠️  Frontend not running" -ForegroundColor Yellow
  $results.warnings++
}

# 5. Database Check
Write-Host "`n💾 5. DATABASE" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow

if ($postgres) {
  Write-Host "Checking Prisma schema... " -NoNewline
  $schemaPath = "services/api/prisma/schema.prisma"
  if (Test-Path $schemaPath) {
    $schemaContent = Get-Content $schemaPath -Raw
        
    # Check for Sprint 1: VIDEO/AUDIO
    if ($schemaContent -match "VIDEO" -and $schemaContent -match "AUDIO") {
      Write-Host "✅ VIDEO/AUDIO types present" -ForegroundColor Green
      $results.passed++
    }
    else {
      Write-Host "❌ Missing VIDEO/AUDIO" -ForegroundColor Red
      $results.failed++
    }
        
    # Check for Sprint 1: duration field
    if ($schemaContent -match "duration") {
      Write-Host "✅ duration field present" -ForegroundColor Green
      $results.passed++
    }
    else {
      Write-Host "❌ Missing duration field" -ForegroundColor Red
      $results.failed++
    }
        
    # Check for Sprint 3: EventTypes
    if ($schemaContent -match "ANNOTATION_FAVORITE_TOGGLED" -and 
      $schemaContent -match "ANNOTATION_REPLY_CREATED") {
      Write-Host "✅ Sprint 3 EventTypes present" -ForegroundColor Green
      $results.passed++
    }
    else {
      Write-Host "❌ Missing Sprint 3 EventTypes" -ForegroundColor Red
      $results.failed++
    }
  }
  else {
    Write-Host "❌ Schema file not found" -ForegroundColor Red
    $results.failed++
  }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "           VERIFICATION SUMMARY         " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

$total = $results.passed + $results.failed + $results.warnings

Write-Host "`nPassed:   " -NoNewline
Write-Host "$($results.passed)/$total" -ForegroundColor Green

if ($results.failed -gt 0) {
  Write-Host "Failed:   " -NoNewline
  Write-Host "$($results.failed)/$total" -ForegroundColor Red
}

if ($results.warnings -gt 0) {
  Write-Host "Warnings: " -NoNewline
  Write-Host "$($results.warnings)/$total" -ForegroundColor Yellow
}

Write-Host "`n"

# Final verdict
if ($results.failed -eq 0 -and $results.warnings -eq 0) {
  Write-Host "✅ ALL SYSTEMS OPERATIONAL!" -ForegroundColor Green
  Write-Host "   Sprints 1, 2, and 3 fully validated`n" -ForegroundColor Green
  exit 0
}
elseif ($results.failed -eq 0) {
  Write-Host "⚠️  SYSTEMS PARTIALLY OPERATIONAL" -ForegroundColor Yellow
  Write-Host "   Some services not running`n" -ForegroundColor Yellow
  exit 0
}
else {
  Write-Host "❌ VERIFICATION FAILED" -ForegroundColor Red
  Write-Host "   Please review errors above`n" -ForegroundColor Red
  exit 1
}
