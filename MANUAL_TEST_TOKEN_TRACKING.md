# Manual Testing - Token Tracking System

**Data:** 25/12/2025  
**Serviços Rodando:**

- ✅ Node.js API: `http://localhost:4000`
- ✅ Python AI Service: `http://localhost:8001`

---

## 🎯 Objetivo

Validar o fluxo completo de rastreamento de tokens:

1. Chamar Python AI Service (gera metadados de tokens via LangChain Callback)
2. Python retorna `usage` no response
3. Node.js API consome e salva no PostgreSQL via `ProviderUsageService`
4. Admin analytics expõe os dados

---

## ⚠️ Pré-requisitos

### 1. Obter Token JWT (Autenticação)

```powershell
# Login como usuário existente
$loginResponse = Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/v1/auth/login" `
  -Body (@{email="seu-email@example.com"; password="sua-senha"} | ConvertTo-Json) `
  -ContentType "application/json"

$token = $loginResponse.accessToken
echo "Token: $token"
```

### 2. Criar Sessão de Leitura

```powershell
# Criar uma reading session
$sessionResponse = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/api/v1/sessions/reading/start" `
  -Headers @{Authorization = "Bearer $token"} `
  -Body (@{contentId="algum-content-id-valido"} | ConvertTo-Json) `
  -ContentType "application/json"

$sessionId = $sessionResponse.id
echo "Session ID: $sessionId"
```

---

## 🧪 Teste 1: Chamar Educator Agent (Python → Node.js)

### Payload de Teste

```json
{
  "promptMessage": {
    "threadId": "test-thread-123",
    "readingSessionId": "SESSION_ID_AQUI",
    "actorRole": "LEARNER",
    "text": "Olá, pode me ajudar?",
    "clientTs": "2025-12-25T21:00:00Z",
    "metadata": {
      "uiMode": "DURING",
      "contentId": "test-content",
      "assetLayer": "L1",
      "readingIntent": "analytical"
    }
  }
}
```

### Comando PowerShell

```powershell
# Enviar prompt ao Educator Agent via Node.js API
$promptPayload = @{
    promptMessage = @{
        threadId = "test-thread-$(Get-Random)"
        readingSessionId = $sessionId
        actorRole = "LEARNER"
        text = "Explique o conceito de fotossíntese de forma simples"
        clientTs = (Get-Date -Format o)
        metadata = @{
            uiMode = "DURING"
            contentId = "test-content-biology"
            assetLayer = "L1"
            readingIntent = "analytical"
        }
    }
} | ConvertTo-Json -Depth 5

$aiResponse = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/api/v1/sessions/reading/$sessionId/prompt" `
  -Headers @{
      Authorization = "Bearer $token"
      "Content-Type" = "application/json"
  } `
  -Body $promptPayload

# Verificar se tem campo 'usage'
$aiResponse | ConvertTo-Json -Depth 5
```

### ✅ Resultado Esperado

```json
{
  "threadId": "test-thread-xxx",
  "readingSessionId": "...",
  "nextPrompt": "Fotossíntese é...",
  "quickReplies": [...],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 80,
    "total_tokens": 230,
    "cost_est_usd": 0.0023
  }
}
```

---

## 🧪 Teste 2: Verificar Persistência no Banco

### Query SQL Direta (PostgreSQL)

```sql
-- Ver últimos registros de usage
SELECT
  id,
  provider,
  operation,
  prompt_tokens,
  completion_tokens,
  total_tokens,
  cost_usd,
  user_id,
  family_id,
  feature,
  timestamp
FROM provider_usage
ORDER BY timestamp DESC
LIMIT 10;
```

### PowerShell (via Prisma Studio ou psql)

```powershell
# Abrir Prisma Studio para inspecionar visualmente (executa no browser)
cd c:\projects\aprendeai-app\services\api
npx prisma studio
```

---

## 🧪 Teste 3: Analytics Admin Endpoints

### 3.1 Overview (Totais)

```powershell
# Últimos 7 dias
$from = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
$to = (Get-Date).ToString("yyyy-MM-dd")

$overview = Invoke-RestMethod -Method GET `
  -Uri "http://localhost:4000/api/v1/admin/ai/overview?from=$from&to=$to" `
  -Headers @{Authorization = "Bearer $token"}

$overview | ConvertTo-Json
```

**Esperado:**

```json
{
  "totalRequests": 5,
  "totalTokens": 1250,
  "totalCostUsd": 0.0125,
  "avgLatency": 1200
}
```

### 3.2 Evolution (Time-Series)

```powershell
# Evolução diária
$evolution = Invoke-RestMethod -Method GET `
  -Uri "http://localhost:4000/api/v1/admin/ai/evolution?from=$from&to=$to&interval=day" `
  -Headers @{Authorization = "Bearer $token"}

$evolution | ConvertTo-Json -Depth 5
```

**Esperado:**

```json
[
  {
    "date": "2025-12-25T00:00:00Z",
    "requests": 3,
    "tokens": 890,
    "cost": 0.0089
  },
  ...
]
```

### 3.3 Distribution (Por Feature)

```powershell
# Distribuição por feature
$distribution = Invoke-RestMethod -Method GET `
  -Uri "http://localhost:4000/api/v1/admin/ai/distribution?dimension=feature&from=$from&to=$to" `
  -Headers @{Authorization = "Bearer $token"}

$distribution | ConvertTo-Json
```

**Esperado:**

```json
[
  {
    "key": "educator_chat",
    "requests": 5,
    "tokens": 1250,
    "cost": 0.0125
  }
]
```

### 3.4 Top Consumers

```powershell
# Top 10 famílias por custo
$topFamilies = Invoke-RestMethod -Method GET `
  -Uri "http://localhost:4000/api/v1/admin/ai/top-consumers?entity=family&limit=10&from=$from&to=$to" `
  -Headers @{Authorization = "Bearer $token"}

$topFamilies | ConvertTo-Json
```

---

## 🐛 Troubleshooting

### Erro: "Cannot read property 'usage' of undefined"

**Causa:** Python AI Service não retornou `usage` no response.

**Solução:** Verificar logs do Python:

```powershell
# Ver logs do Uvicorn
# (deve mostrar "TokenUsageTracker" sendo instanciado)
```

### Erro: "Column 'cost_usd' does not exist"

**Causa:** Prisma Client não foi regenerado após migração.

**Solução:**

```powershell
cd c:\projects\aprendeai-app\services\api
npx prisma generate
# Reiniciar Node.js API
```

### Erro: 401 Unauthorized nos endpoints /admin/ai

**Causa:** Token JWT não tem role ADMIN.

**Solução:** Logar com usuário Admin ou atualizar role no banco:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'seu-email@example.com';
```

---

## 📊 Checklist de Validação

- [ ] **Python AI Service** retorna campo `usage` no response
- [ ] **Node.js API** persiste dados em `provider_usage` table
- [ ] Colunas granulares populadas:
  - [ ] `prompt_tokens`
  - [ ] `completion_tokens`
  - [ ] `cost_usd`
  - [ ] `family_id` (se usuário pertence a família)
  - [ ] `feature = "educator_chat"`
- [ ] **Admin Analytics** endpoints retornam dados:
  - [ ] `/admin/ai/overview`
  - [ ] `/admin/ai/evolution`
  - [ ] `/admin/ai/distribution`
  - [ ] `/admin/ai/top-consumers`

---

## 🎉 Sucesso Esperado

Se todos os testes passarem:

1. ✅ Cada chamada ao Educator Agent gera 1 registro em `provider_usage`
2. ✅ Dados granulares (tokens split, custo) estão presentes
3. ✅ Atribuição de contexto (user/family/institution) funciona
4. ✅ Analytics agregados (totais, séries temporais, distribuições) calculam corretamente

**Sistema de Token Tracking:** 100% Funcional ✅
