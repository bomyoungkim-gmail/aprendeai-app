# HMAC Authentication Setup Instructions

## 📋 Passo 1: Adicionar Secret aos Arquivos .env

### Backend (NestJS) - `services/api/.env.local`

Adicione esta linha:

```bash
AI_SERVICE_SECRET=63da82c1b7549ab2b4649585d21ea979340e377255f67110a42f16f53dae81898
```

### AI Service (FastAPI) - `services/ai/.env`

Adicione esta linha:

```bash
AI_SERVICE_SECRET=63da82c1b7549ab2b4649585d21ea979340e377255f67110a42f16f53dae81898
```

---

## 🧪 Passo 2: Testar HMAC

### Opção A: Teste Automatizado (Recomendado)

```bash
# 1. Certifique-se que o AI Service está rodando
cd services/ai
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8001

# 2. Em outro terminal, rode o teste
python test_hmac.py
```

**Resultado Esperado**:

```
✅ PASS: Got 401 as expected (missing signature)
✅ PASS: Got 401 as expected (invalid signature)
✅ PASS: Health check bypasses auth
✅ PASS: Signature accepted (valid signature)
```

### Opção B: Teste Manual (curl)

```bash
# Test 1: Missing signature → 401
curl -X POST http://localhost:8001/educator/turn \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Test 2: Invalid signature → 401
curl -X POST http://localhost:8001/educator/turn \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=INVALID" \
  -H "X-Correlation-ID: test-123" \
  -d '{"test":"data"}'

# Test 3: Health check → 200 (bypasses auth)
curl http://localhost:8001/health
```

---

## ✅ Checklist

- [ ] AI_SERVICE_SECRET adicionado em `services/api/.env.local`
- [ ] AI_SERVICE_SECRET adicionado em `services/ai/.env`
- [ ] AI Service iniciado com sucesso (sem erro de secret)
- [ ] Teste 1 passou: 401 sem signature
- [ ] Teste 2 passou: 401 signature inválida
- [ ] Teste 3 passou: 200 health check
- [ ] Teste 4 passou: 200/500 signature válida

---

## 🐛 Troubleshooting

**Erro: "AI_SERVICE_SECRET must be set"**

- Verifique se adicionou a variável no arquivo .env
- Reinicie o serviço

**Erro: "Invalid signature"**

- Verifique se o secret é EXATAMENTE igual em ambos arquivos
- Não deve ter espaços ou quebras de linha

**Teste válido retorna 500**

- Normal! A signature passou, mas pode falhar no processamento (banco, LLM, etc)
- O importante é NÃO retornar 401
