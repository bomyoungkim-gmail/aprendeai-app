# 🚀 Quick Start Guide - Manual Execution

**Updated:** 2025-12-20 08:12  
**Status:** ENV Fixed, Ready to Start

---

## ✅ Pre-flight Checklist

- [x] Docker services running (postgres, redis, rabbitmq)
- [x] ENV files configured correctly
- [x] ADMIN_MASTER_KEY updated (32 bytes)
- [x] No conflicting .env files

---

## 📋 Step-by-Step Instructions

### 1️⃣ Start API (in Terminal 1)

```powershell
# Navigate to API directory
cd C:\projects\aprendeai-app\services\api

# Start development server
npm run start:dev

# ✅ Wait for: "🚀 API running on http://localhost:4000"
```

**Expected Output:**

```
[Nest] Starting Nest application...
[NestFactory] Starting Nest application...
[RouterExplorer] Mapped {/health, GET} route
...
[NestApplication] Nest application successfully started
[Bootstrap] 🚀 API running on http://localhost:4000
[Bootstrap] 📚 API Docs: http://localhost:4000/api/docs
```

**Common Issues:**

| Error                                        | Solution                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `EADDRINUSE: address already in use :::4000` | Kill process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess` |
| `ADMIN_MASTER_KEY must be 32 bytes`          | Already fixed in .env.local ✅                                                        |
| `Failed to connect to RabbitMQ`              | Check: `docker ps \| grep rabbitmq`                                                   |

---

### 2️⃣ Test API Health (in Terminal 2)

```powershell
# Test health endpoint
curl http://localhost:4000/health

# Expected response:
# {"status":"ok"}
```

---

### 3️⃣ Test Login Endpoint

```powershell
# Test authentication (if you have test user)
curl -X POST http://localhost:4000/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### 4️⃣ Start Frontend (in Terminal 3)

```powershell
# Navigate to frontend directory
cd C:\projects\aprendeai-app\frontend

# Start development server
npm run dev

# ✅ Wait for: "ready - started server on 0.0.0.0:3000"
```

**Expected Output:**

```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

### 5️⃣ Verify Frontend Connection

```powershell
# Open browser
start http://localhost:3000

# Frontend should:
# ✅ Load without errors
# ✅ Connect to API at localhost:4000
# ✅ Show login/signup page
```

---

## 🔍 Verification Commands

### Check Docker Services

```powershell
docker ps | Select-String "socrates"
```

**Expected:**

```
socrates-postgres   Up (healthy)
socrates-redis      Up (healthy)
socrates-rabbitmq   Up (healthy)
```

### Check API Logs

```powershell
# If API is running in background
# Check the terminal where you ran npm run start:dev
```

### Check Port Usage

```powershell
# Check what's running on port 4000
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue

# Check what's running on port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

---

## 🐛 Troubleshooting

### Kill Process on Port

```powershell
# Kill process on port 4000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess -Force

# Kill process on port 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### Restart Docker Services

```powershell
cd C:\projects\aprendeai-app
docker compose restart postgres redis rabbitmq
```

### Check ENV Files

```powershell
# Verify API config
Get-Content services/api/.env.local | Select-String "PORT|RABBITMQ|ADMIN_MASTER_KEY"

# Verify Frontend config
Get-Content frontend/.env.local
```

---

## ✅ Success Criteria

- [ ] API started on PORT 4000
- [ ] Health check returns `{"status":"ok"}`
- [ ] No RabbitMQ connection errors
- [ ] Frontend started on PORT 3000
- [ ] Frontend can access `http://localhost:4000`
- [ ] No CORS errors in browser console

---

## 📊 Current Configuration

```
API:       http://localhost:4000
Frontend:  http://localhost:3000
API Docs:  http://localhost:4000/api/docs

Database:  localhost:5432
Redis:     localhost:6379
RabbitMQ:  localhost:5672 (Management: 15672)
```

---

## 🎯 Next Steps After Both Running

### Run E2E Tests

```powershell
cd C:\projects\aprendeai-app\frontend
npx playwright test family-plan.spec.ts
```

### Access Swagger Docs

```
http://localhost:4000/api/docs
```

### Access RabbitMQ Management

```
http://localhost:15672
Login: guest / guest
```

---

**Note:** Evite usar comandos que tentam terminar processos automaticamente, pois podem travar. Prefira:

1. Ctrl+C no terminal para parar
2. Ou usar `Stop-Process` manualmente se necessário
