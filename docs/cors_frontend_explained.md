# CORS vs Frontend URL - Explicação Visual

## ✅ Configuração CORRETA (Atual)

```env
# Em services/api/.env.local
CORS_ORIGIN=http://localhost:3000      # ✅ Porta do Frontend
FRONTEND_URL=http://localhost:3000     # ✅ Porta do Frontend
```

---

## 🎯 Arquitetura de Portas

```
┌──────────────────────────────────────────────────────┐
│                    Seu Computador                     │
│                                                        │
│  ┌─────────────────┐           ┌─────────────────┐  │
│  │   Frontend      │           │   API Backend   │  │
│  │   Next.js       │◄─────────►│   NestJS        │  │
│  │   PORT 3000     │   HTTP    │   PORT 4000     │  │
│  └─────────────────┘           └─────────────────┘  │
│         ▲                              │             │
│         │                              │             │
│         └──────────────────────────────┘             │
│          Frontend faz requisições                    │
│          para API na porta 4000                      │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Requisição Detalhado

### 1. Usuário Acessa Frontend

```
Browser → http://localhost:3000
          ↓
    Frontend carrega
```

### 2. Frontend Faz Requisição à API

```javascript
// Código no Frontend (porta 3000)
fetch("http://localhost:4000/api/users", {
  headers: {
    Origin: "http://localhost:3000", // ← Browser adiciona automaticamente
  },
});
```

### 3. API Verifica CORS

```javascript
// API (porta 4000) verifica:
const requestOrigin = "http://localhost:3000"; // De onde veio?
const allowedOrigin = process.env.CORS_ORIGIN; // 'http://localhost:3000'

if (requestOrigin === allowedOrigin) {
  // ✅ Permitir acesso
  response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
} else {
  // ❌ Bloquear (CORS error)
}
```

### 4. API Processa e Responde

```
API (porta 4000) → Response → Frontend (porta 3000)
```

---

## 📊 Matriz de Configuração

| Cenário       | Frontend | API         | CORS_ORIGIN | FRONTEND_URL | Resultado            |
| ------------- | -------- | ----------- | ----------- | ------------ | -------------------- |
| **Local Dev** | :3000    | :4000       | :3000       | :3000        | ✅ Funciona          |
| **Produção**  | app.com  | api.app.com | app.com     | app.com      | ✅ Funciona          |
| ❌ Errado     | :3000    | :4000       | **:4000**   | :3000        | ❌ CORS Error        |
| ❌ Errado     | :3000    | :4000       | :3000       | **:4000**    | ❌ Redirects Errados |

---

## 🎭 Casos de Uso do FRONTEND_URL

A API usa `FRONTEND_URL` para gerar links que apontam DE VOLTA para o frontend:

### 1. Email de Boas-Vindas

```javascript
// API enviando email
const emailHTML = `
  <h1>Bem-vindo!</h1>
  <a href="${process.env.FRONTEND_URL}/dashboard">
    Acesse seu dashboard
  </a>
`;
// Link: http://localhost:3000/dashboard ✅
```

### 2. Reset de Senha

```javascript
// API gerando token de reset
const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
// Link: http://localhost:3000/reset-password?token=xyz ✅
```

### 3. OAuth Redirect

```javascript
// Após login com Google/Microsoft
redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwt}`);
// Redirect para: http://localhost:3000/auth/callback?token=abc ✅
```

### 4. Webhooks

```javascript
// API registrando webhook em serviço externo
const webhookURL = `${process.env.FRONTEND_URL}/api/webhook/payment`;
// URL: http://localhost:3000/api/webhook/payment ✅
```

---

## 🎯 Casos de Uso do CORS_ORIGIN

### 1. Requisições AJAX/Fetch

```javascript
// Frontend fazendo login
fetch("http://localhost:4000/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
// API verifica: "Veio de localhost:3000?" ✅ Sim, permitir
```

### 2. Requests com Cookies

```javascript
// Frontend com credenciais
fetch("http://localhost:4000/api/users/me", {
  credentials: "include", // Envia cookies
});
// API precisa verificar CORS_ORIGIN para permitir credenciais
```

### 3. Preflight Requests (OPTIONS)

```javascript
// Browser envia automaticamente antes de POST/PUT/DELETE
OPTIONS http://localhost:4000/api/content
// API responde:
// Access-Control-Allow-Origin: http://localhost:3000 ✅
// Access-Control-Allow-Methods: POST, PUT, DELETE
```

---

## ⚠️ Problemas Comuns

### Problema 1: CORS_ORIGIN Errado

```env
❌ CORS_ORIGIN=http://localhost:4000  # Apontando para a própria API!
```

**Erro no Browser:**

```
Access to fetch at 'http://localhost:4000/api/users' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Por quê?** API está dizendo "só aceito requisições vindas de localhost:4000", mas as requisições vêm de localhost:3000!

---

### Problema 2: FRONTEND_URL Errado

```env
❌ FRONTEND_URL=http://localhost:4000  # Apontando para API!
```

**Resultado:**

- Email com link para dashboard → Usuário cai em `localhost:4000/dashboard` (404 na API)
- Reset de senha → Usuário cai na API ao invés da UI
- OAuth redirect → Usuário vê JSON ao invés da interface

---

## ✅ Resumo

### Por Que Ambos Usam :3000?

1. **CORS_ORIGIN** = Onde o frontend ESTÁ (porta 3000)
2. **FRONTEND_URL** = Para onde enviar usuários (porta 3000)

### Analogia

Imagine que:

- Frontend = Loja física (porta 3000)
- API = Depósito/Warehouse (porta 4000)

**CORS_ORIGIN:** "Só aceito pedidos vindos da minha loja na Rua 3000"  
**FRONTEND_URL:** "Quando terminar o pedido, envie o cliente para a loja na Rua 3000"

Ambos apontam para a **mesma loja** (frontend), porque:

- Os pedidos VÊM da loja
- Os clientes VOLTAM para a loja

---

## 🎓 Configuração em Diferentes Ambientes

### Development (Atual)

```env
PORT=4000
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### Staging

```env
PORT=4000
CORS_ORIGIN=https://staging.aprendeai.com
FRONTEND_URL=https://staging.aprendeai.com
```

### Production

```env
PORT=4000
CORS_ORIGIN=https://aprendeai.com
FRONTEND_URL=https://aprendeai.com
```

**Nota:** Em produção, frontend e API podem estar no mesmo domínio ou em subdomínios diferentes (ex: `app.example.com` e `api.example.com`)

---

## ✅ Conclusão

**SIM, está CORRETO que ambos usem porta 3000!**

- `CORS_ORIGIN` = De onde as requisições vêm (frontend :3000)
- `FRONTEND_URL` = Para onde os usuários devem ir (frontend :3000)
- `API PORT` = Onde a API escuta (api :4000)

**Tudo funcionando como esperado!** ✅
