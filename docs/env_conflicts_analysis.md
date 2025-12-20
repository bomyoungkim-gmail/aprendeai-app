# ⚠️ ENV Files Conflict Analysis

**Date:** 2025-12-20  
**Status:** CRITICAL CONFLICTS DETECTED

---

## 📁 Current ENV Files

### 1. Root `.env` (Docker Compose)

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/aprendeai
JWT_SECRET=your-secret-key-change-in-production
ADMIN_MASTER_KEY=9gKpxS5pmi6tSnBdfOyXGagfe7d3HHYQyPnUa8ZIn5tE=
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### 2. `services/api/.env` (API Config)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aprendeai?schema=public"
JWT_SECRET=dev_jwt_secret_key_change_in_production_123456789
NODE_ENV=development
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:admin@localhost:5672  ⚠️ WRONG CREDENTIALS
PORT=3000  ⚠️ WRONG PORT
API_PREFIX=/api
CORS_ORIGIN=http://localhost:3001
STORAGE_PROVIDER=LOCAL
STORAGE_LOCAL_PATH=./uploads
STORAGE_BASE_URL=http://localhost:3000
ADMIN_MASTER_KEY=jr6h2qSv0a0UuDYAte76gYvrzGrETP3nJSsZw4YDN2Y=  ⚠️ DIFFERENT KEY
```

### 3. `services/api/.env.local` (API Local Override)

```env
PORT=4000  ✅ CORRECT
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aprendeai
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672  ✅ CORRECT
JWT_SECRET=dev-secret-key-change-in-production
```

### 4. `frontend/.env.local` (Frontend Config)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000  ⚠️ WRONG PORT (should be 4000)
NEXT_PUBLIC_ENV=development
```

---

## 🚨 CONFLICTS IDENTIFIED

### Priority 1: CRITICAL

| Variable                | Root .env  | api/.env           | api/.env.local     | frontend/.env.local | Conflict? |
| ----------------------- | ---------- | ------------------ | ------------------ | ------------------- | --------- |
| **PORT**                | 4000       | **3000** ❌        | **4000** ✅        | -                   | YES       |
| **RABBITMQ_URL**        | -          | **admin:admin** ❌ | **guest:guest** ✅ | -                   | YES       |
| **ADMIN_MASTER_KEY**    | `9gKpx...` | **`jr6h2...`** ❌  | -                  | -                   | YES       |
| **NEXT_PUBLIC_API_URL** | -          | -                  | -                  | **:3000** ❌        | YES       |

### Priority 2: INCONSISTENCIES

| Variable         | Root .env            | api/.env                | api/.env.local      | Issue               |
| ---------------- | -------------------- | ----------------------- | ------------------- | ------------------- |
| **JWT_SECRET**   | `your-secret-key...` | `dev_jwt_secret_key...` | `dev-secret-key...` | 3 different values  |
| **DATABASE_URL** | `@postgres` (Docker) | `@localhost`            | `@localhost`        | Docker vs localhost |
| **CORS_ORIGIN**  | -                    | `:3001` ❌              | -                   | Wrong frontend port |

---

## 🔍 How ENV Loading Works

### Node.js (NestJS API)

**Load Order (last wins):**

1. `services/api/.env` (base config)
2. `services/api/.env.local` (overrides base) ✅ **WINS**
3. Environment variables from shell/Docker

**Current Winner:** `.env.local` ✅ (mostly correct)

### Docker Compose

**Load Order:**

1. Root `.env` file
2. `environment:` section in docker-compose.yml
3. Command-line `-e` flags

**Current Status:** Uses root `.env` + docker-compose overrides

### Next.js (Frontend)

**Load Order:**

1. `frontend/.env.local` (development)
2. `frontend/.env` (if exists)
3. System environment variables

**Current Winner:** `.env.local` ❌ (has wrong API URL)

---

## ✅ RECOMMENDED SOLUTION

### Strategy: **Consolidate & Clarify**

Use `.env.local` files for local development (ignored by git), and keep `.env` as templates.

### Action Plan

#### 1. Root `.env` - Docker Compose Variables ONLY

Keep for Docker services (postgres, redis, rabbitmq):

```env
# Database (Docker)
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=aprendeai

# RabbitMQ (Docker)
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# API Keys (shared across services)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_API_KEY=AIza-your-key-here

# LLM Provider Config
LLM_PROVIDER=openai
```

#### 2. `services/api/.env` - Template Only

This should be a TEMPLATE (committed to git):

```env
# Copy this to .env.local and customize

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aprendeai

# JWT
JWT_SECRET=change-me-in-env-local

# Encryption
ADMIN_MASTER_KEY=generate-with-crypto-randomBytes

# Services
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Server
PORT=4000
NODE_ENV=development
```

#### 3. `services/api/.env.local` - Active Config ✅

**USE THIS for actual development** (gitignored):

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aprendeai
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=dev-secret-key-change-in-production
ADMIN_MASTER_KEY=9gKpxS5pmi6tSnBdfOyXGagfe7d3HHYQyPnUa8ZIn5tE=
STORAGE_PROVIDER=LOCAL
STORAGE_LOCAL_PATH=./uploads
CORS_ORIGIN=http://localhost:3000
```

#### 4. `frontend/.env.local` - Fix API URL ❌

**NEEDS IMMEDIATE FIX:**

```env
# API Base URL - MUST match API PORT
NEXT_PUBLIC_API_URL=http://localhost:4000  # ← FIX THIS!

# Environment
NEXT_PUBLIC_ENV=development
```

---

## 🛠️ Immediate Actions Required

### Step 1: Fix Frontend API URL ⚠️ URGENT

```bash
# Update frontend/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > frontend/.env.local
echo "NEXT_PUBLIC_ENV=development" >> frontend/.env.local
```

### Step 2: Consolidate API Config

```bash
# Delete services/api/.env (use it only as template)
# Keep services/api/.env.local as the active config
```

### Step 3: Update services/api/.env.local

Add missing variables:

```bash
# Add to services/api/.env.local:
ADMIN_MASTER_KEY=9gKpxS5pmi6tSnBdfOyXGagfe7d3HHYQyPnUa8ZIn5tE=
STORAGE_PROVIDER=LOCAL
STORAGE_LOCAL_PATH=./uploads
CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api
```

### Step 4: Restart Services

```bash
# Restart frontend to pick up new API URL
cd frontend
# Ctrl+C then npm run dev

# Restart API to pick up consolidated config
cd services/api
# npm run start:dev should already be using .env.local
```

---

## 📊 Priority Matrix

| Issue                           | Severity    | Impact                        | Action                    |
| ------------------------------- | ----------- | ----------------------------- | ------------------------- |
| Frontend API URL (3000 vs 4000) | 🔴 CRITICAL | Frontend can't connect to API | Fix immediately           |
| RabbitMQ credentials conflict   | 🟡 MEDIUM   | Queue not working             | .env.local wins (correct) |
| Multiple JWT secrets            | 🟡 MEDIUM   | Token validation issues       | Standardize to one        |
| ADMIN_MASTER_KEY conflict       | 🟡 MEDIUM   | Encryption/decryption errors  | Use root .env value       |
| PORT conflict in api/.env       | 🟢 LOW      | .env.local overrides it       | Keep .env.local           |

---

## 🎯 Final Recommended Structure

```
aprendeai-app/
├── .env                      # Docker Compose variables only
├── .env.example              # Template for all projects
│
├── services/api/
│   ├── .env                  # TEMPLATE only (committed)
│   └── .env.local           # ACTIVE config (gitignored) ✅
│
└── frontend/
    ├── .env                  # TEMPLATE only (committed)
    └── .env.local           # ACTIVE config (gitignored) ⚠️ FIX URL
```

---

## ✅ Validation Checklist

After fixes:

- [ ] Frontend connects to **http://localhost:4000**
- [ ] API runs on **PORT 4000**
- [ ] RabbitMQ uses **guest:guest** credentials
- [ ] Single **ADMIN_MASTER_KEY** across all configs
- [ ] Single **JWT_SECRET** for token consistency
- [ ] No port conflicts (API=4000, Frontend=3000)

---

**Next Step:** Fix `frontend/.env.local` immediately!
